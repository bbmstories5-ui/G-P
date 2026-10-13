import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const categoryId = searchParams.get('categoryId');
    const categoryCode = searchParams.get('categoryCode');
    const status = searchParams.get('status');
    const includeInactive = searchParams.get('all') === 'true' && user.role === 'ADMIN';

    // Single template fetch
    if (id) {
      const template = await prisma.creativeTemplate.findUnique({
        where: { id },
        include: {
          category: true,
          elements: {
            orderBy: { zIndex: 'asc' },
          },
        },
      });
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    // Role-based status filtering: Members ONLY see PUBLISHED templates
    if (user.role !== 'ADMIN') {
      where.status = 'PUBLISHED';
    } else if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (categoryCode) {
      where.category = { code: categoryCode };
    }

    const templates = await prisma.creativeTemplate.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        elements: {
          orderBy: { zIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();

    // Check for duplicate action
    if (body.action === 'duplicate' && body.templateId) {
      const source = await prisma.creativeTemplate.findUnique({
        where: { id: body.templateId },
        include: { elements: true },
      });
      if (!source) {
        return NextResponse.json({ error: 'Source template not found' }, { status: 404 });
      }

      const newName = `${source.name} (Copy)`;
      const newSlug = `${source.slug}-copy-${Date.now()}`;

      const duplicated = await prisma.creativeTemplate.create({
        data: {
          categoryId: source.categoryId,
          name: newName,
          slug: newSlug,
          description: source.description,
          previewImageUrl: source.previewImageUrl,
          backgroundUrl: source.backgroundUrl,
          baseDesignUrl: source.baseDesignUrl,
          width: source.width,
          height: source.height,
          orientation: source.orientation,
          themeStyle: source.themeStyle,
          logoPosition: source.logoPosition,
          logoMaxWidth: source.logoMaxWidth,
          logoMaxHeight: source.logoMaxHeight,
          layoutVariant: source.layoutVariant,
          status: 'DRAFT',
          approvalRequired: source.approvalRequired,
          placeholders: source.placeholders,
          stylingConfig: source.stylingConfig,
          isActive: true,
          isDefault: false,
          sortOrder: source.sortOrder + 1,
          createdById: user.id,
          elements: {
            create: source.elements.map((el) => ({
              elementType: el.elementType,
              fieldKey: el.fieldKey,
              name: el.name,
              posX: el.posX,
              posY: el.posY,
              width: el.width,
              height: el.height,
              fontFamily: el.fontFamily,
              fontSize: el.fontSize,
              fontWeight: el.fontWeight,
              textColor: el.textColor,
              textAlign: el.textAlign,
              lineSpacing: el.lineSpacing,
              maxLines: el.maxLines,
              overflowBehavior: el.overflowBehavior,
              zIndex: el.zIndex,
              isLocked: el.isLocked,
              isVisible: el.isVisible,
              isRequired: el.isRequired,
              defaultValue: el.defaultValue,
              styleConfig: el.styleConfig,
            })),
          },
        },
        include: {
          category: true,
          elements: true,
        },
      });

      return NextResponse.json({ success: true, template: duplicated });
    }

    const {
      id,
      categoryId,
      name,
      slug,
      description,
      previewImageUrl,
      backgroundUrl,
      baseDesignUrl,
      width = 1080,
      height = 1080,
      orientation = 'SQUARE',
      themeStyle = 'white-gold',
      logoPosition = 'top-left',
      logoMaxWidth = 200,
      logoMaxHeight = 70,
      layoutVariant = 'variant-1',
      status = 'PUBLISHED',
      approvalRequired = false,
      placeholders,
      stylingConfig,
      elements = [],
      isActive = true,
      isDefault = false,
      sortOrder = 0,
    } = body;

    if (!categoryId || !name) {
      return NextResponse.json({ error: 'Category ID and template name are required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Prevent duplicate template names in database
    const duplicateTemplate = await prisma.creativeTemplate.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        ...(id ? { id: { not: id } } : {}),
      },
    });

    if (duplicateTemplate) {
      return NextResponse.json(
        { error: `A template named "${trimmedName}" already exists. Please use a unique template name.` },
        { status: 400 }
      );
    }

    // If ID is provided, check if the template exists to update it rather than duplicating
    if (id) {
      const existingTpl = await prisma.creativeTemplate.findUnique({ where: { id } });
      if (existingTpl) {
        if (isDefault) {
          await prisma.creativeTemplate.updateMany({
            where: { categoryId, isDefault: true, id: { not: id } },
            data: { isDefault: false },
          });
        }

        // Replace elements for this existing template
        if (Array.isArray(elements)) {
          await prisma.templateElement.deleteMany({ where: { templateId: id } });
          if (elements.length > 0) {
            await prisma.templateElement.createMany({
              data: elements.map((el: any) => ({
                templateId: id,
                elementType: el.elementType || 'DYNAMIC_FIELD',
                fieldKey: el.fieldKey || null,
                name: el.name || 'Field',
                posX: Number(el.posX) || 0,
                posY: Number(el.posY) || 0,
                width: Number(el.width) || 200,
                height: Number(el.height) || 50,
                fontFamily: el.fontFamily || 'Inter',
                fontSize: Number(el.fontSize) || 24,
                fontWeight: el.fontWeight || 'normal',
                textColor: el.textColor || '#000000',
                textAlign: el.textAlign || 'left',
                lineSpacing: Number(el.lineSpacing) || 1.2,
                maxLines: Number(el.maxLines) || 1,
                overflowBehavior: el.overflowBehavior || 'wrap',
                zIndex: Number(el.zIndex) || 1,
                isLocked: Boolean(el.isLocked),
                isVisible: el.isVisible !== false,
                isRequired: el.isRequired !== false,
                defaultValue: el.defaultValue || null,
                styleConfig: typeof el.styleConfig === 'string' ? el.styleConfig : JSON.stringify(el.styleConfig || {}),
              })),
            });
          }
        }

        const updated = await prisma.creativeTemplate.update({
          where: { id },
          data: {
            categoryId,
            name: trimmedName,
            description: description !== undefined ? description : undefined,
            previewImageUrl: previewImageUrl !== undefined ? previewImageUrl : undefined,
            backgroundUrl: backgroundUrl !== undefined ? backgroundUrl : undefined,
            baseDesignUrl: baseDesignUrl !== undefined ? baseDesignUrl : undefined,
            width: Number(width) || 1080,
            height: Number(height) || 1080,
            orientation: orientation || 'SQUARE',
            themeStyle: themeStyle || 'white-gold',
            logoPosition: logoPosition || 'top-left',
            logoMaxWidth: Number(logoMaxWidth) || 200,
            logoMaxHeight: Number(logoMaxHeight) || 70,
            layoutVariant: layoutVariant || 'variant-1',
            status: status || 'PUBLISHED',
            approvalRequired: Boolean(approvalRequired),
            placeholders: typeof placeholders === 'string' ? placeholders : JSON.stringify(placeholders || []),
            stylingConfig: typeof stylingConfig === 'string' ? stylingConfig : JSON.stringify(stylingConfig || {}),
            isActive: isActive !== false,
            isDefault: Boolean(isDefault),
            sortOrder: Number(sortOrder) || 0,
          },
          include: {
            category: true,
            elements: { orderBy: { zIndex: 'asc' } },
          },
        });

        return NextResponse.json({ success: true, template: updated, message: 'Template updated successfully' });
      }
    }

    // Creating new template
    const generatedSlug = slug
      ? slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : `${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    // If setting as default, unset other defaults in this category
    if (isDefault) {
      await prisma.creativeTemplate.updateMany({
        where: { categoryId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.creativeTemplate.create({
      data: {
        categoryId,
        name: trimmedName,
        slug: generatedSlug,
        description: description || null,
        previewImageUrl: previewImageUrl || null,
        backgroundUrl: backgroundUrl || null,
        baseDesignUrl: baseDesignUrl || null,
        width: Number(width) || 1080,
        height: Number(height) || 1080,
        orientation: orientation || 'SQUARE',
        themeStyle: themeStyle || 'white-gold',
        logoPosition: logoPosition || 'top-left',
        logoMaxWidth: Number(logoMaxWidth) || 200,
        logoMaxHeight: Number(logoMaxHeight) || 70,
        layoutVariant: layoutVariant || 'variant-1',
        status: status || 'PUBLISHED',
        approvalRequired: Boolean(approvalRequired),
        placeholders: typeof placeholders === 'string' ? placeholders : JSON.stringify(placeholders || []),
        stylingConfig: typeof stylingConfig === 'string' ? stylingConfig : JSON.stringify(stylingConfig || {}),
        isActive: isActive !== false,
        isDefault: Boolean(isDefault),
        sortOrder: Number(sortOrder) || 0,
        createdById: user.id,
        elements: {
          create: Array.isArray(elements)
            ? elements.map((el: any) => ({
                elementType: el.elementType || 'DYNAMIC_FIELD',
                fieldKey: el.fieldKey || null,
                name: el.name || 'Field',
                posX: Number(el.posX) || 0,
                posY: Number(el.posY) || 0,
                width: Number(el.width) || 200,
                height: Number(el.height) || 50,
                fontFamily: el.fontFamily || 'Inter',
                fontSize: Number(el.fontSize) || 24,
                fontWeight: el.fontWeight || 'normal',
                textColor: el.textColor || '#000000',
                textAlign: el.textAlign || 'left',
                lineSpacing: Number(el.lineSpacing) || 1.2,
                maxLines: Number(el.maxLines) || 1,
                overflowBehavior: el.overflowBehavior || 'wrap',
                zIndex: Number(el.zIndex) || 1,
                isLocked: Boolean(el.isLocked),
                isVisible: el.isVisible !== false,
                isRequired: el.isRequired !== false,
                defaultValue: el.defaultValue || null,
                styleConfig: typeof el.styleConfig === 'string' ? el.styleConfig : JSON.stringify(el.styleConfig || {}),
              }))
            : [],
        },
      },
      include: {
        category: true,
        elements: true,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error('Failed to create template:', error);
    return NextResponse.json({ error: error.message || 'Failed to create template' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      name,
      description,
      previewImageUrl,
      backgroundUrl,
      baseDesignUrl,
      width,
      height,
      orientation,
      themeStyle,
      logoPosition,
      logoMaxWidth,
      logoMaxHeight,
      layoutVariant,
      status,
      approvalRequired,
      placeholders,
      stylingConfig,
      elements,
      isActive,
      isDefault,
      sortOrder,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const existing = await prisma.creativeTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (name) {
      const trimmedName = name.trim();
      const duplicate = await prisma.creativeTemplate.findFirst({
        where: {
          name: { equals: trimmedName, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `A template named "${trimmedName}" already exists. Please choose a different name.` },
          { status: 400 }
        );
      }
    }

    if (isDefault) {
      await prisma.creativeTemplate.updateMany({
        where: { categoryId: existing.categoryId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // If elements provided, replace existing template elements
    if (Array.isArray(elements)) {
      await prisma.templateElement.deleteMany({ where: { templateId: id } });
      if (elements.length > 0) {
        await prisma.templateElement.createMany({
          data: elements.map((el: any) => ({
            templateId: id,
            elementType: el.elementType || 'DYNAMIC_FIELD',
            fieldKey: el.fieldKey || null,
            name: el.name || 'Field',
            posX: Number(el.posX) || 0,
            posY: Number(el.posY) || 0,
            width: Number(el.width) || 200,
            height: Number(el.height) || 50,
            fontFamily: el.fontFamily || 'Inter',
            fontSize: Number(el.fontSize) || 24,
            fontWeight: el.fontWeight || 'normal',
            textColor: el.textColor || '#000000',
            textAlign: el.textAlign || 'left',
            lineSpacing: Number(el.lineSpacing) || 1.2,
            maxLines: Number(el.maxLines) || 1,
            overflowBehavior: el.overflowBehavior || 'wrap',
            zIndex: Number(el.zIndex) || 1,
            isLocked: Boolean(el.isLocked),
            isVisible: el.isVisible !== false,
            isRequired: el.isRequired !== false,
            defaultValue: el.defaultValue || null,
            styleConfig: typeof el.styleConfig === 'string' ? el.styleConfig : JSON.stringify(el.styleConfig || {}),
          })),
        });
      }
    }

    const template = await prisma.creativeTemplate.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        previewImageUrl: previewImageUrl !== undefined ? previewImageUrl : undefined,
        backgroundUrl: backgroundUrl !== undefined ? backgroundUrl : undefined,
        baseDesignUrl: baseDesignUrl !== undefined ? baseDesignUrl : undefined,
        width: width !== undefined ? Number(width) : undefined,
        height: height !== undefined ? Number(height) : undefined,
        orientation: orientation !== undefined ? orientation : undefined,
        themeStyle: themeStyle !== undefined ? themeStyle : undefined,
        logoPosition: logoPosition !== undefined ? logoPosition : undefined,
        logoMaxWidth: logoMaxWidth !== undefined ? Number(logoMaxWidth) : undefined,
        logoMaxHeight: logoMaxHeight !== undefined ? Number(logoMaxHeight) : undefined,
        layoutVariant: layoutVariant !== undefined ? layoutVariant : undefined,
        status: status !== undefined ? status : undefined,
        approvalRequired: approvalRequired !== undefined ? Boolean(approvalRequired) : undefined,
        placeholders: placeholders !== undefined
          ? (typeof placeholders === 'string' ? placeholders : JSON.stringify(placeholders))
          : undefined,
        stylingConfig: stylingConfig !== undefined
          ? (typeof stylingConfig === 'string' ? stylingConfig : JSON.stringify(stylingConfig))
          : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
      include: {
        category: true,
        elements: {
          orderBy: { zIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error('Failed to update template:', error);
    return NextResponse.json({ error: error.message || 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const template = await prisma.creativeTemplate.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Comprehensive cascading delete of all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete all generated creatives referencing this template
      await tx.generatedCreative.deleteMany({
        where: { templateId: id },
      });

      // 2. Delete all member creative requests submitted for this template
      await tx.creativeRequest.deleteMany({
        where: { templateId: id },
      });

      // 3. Delete all canvas elements belonging to this template
      await tx.templateElement.deleteMany({
        where: { templateId: id },
      });

      // 4. Finally delete the master template record
      await tx.creativeTemplate.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Template "${template.name}" and all associated database records have been permanently deleted.`,
    });
  } catch (error: any) {
    console.error('Failed to delete template:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete template' }, { status: 500 });
  }
}
