import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schema/category.schema';
import {
  AdminListCategoriesQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';
import { ProductDocument } from '../product/schema/product.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SlugService } from '../common/services/slug.service';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel('Category')
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel('Product')
    private readonly productModel: Model<ProductDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly slugService: SlugService,
    private readonly paginationService: PaginationService,
  ) {}

  async createCategory(body: CreateCategoryDto) {
    if (body.parentId) {
      const parent = await this.categoryModel.findById(body.parentId);
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    let slug = this.slugService.slugify(body.name);
    const existing = await this.categoryModel.findOne({ slug });
    if (existing)
      slug = this.slugService.uniqueSlug(
        body.name,
        Date.now().toString().slice(-4),
      );

    const category = await this.categoryModel.create({
      name: body.name,
      slug,
      parentId: body.parentId ?? null,
      isActive: body.isActive,
    });

    return category;
  }

  async uploadCategoryImage(categoryId: string, file: Express.Multer.File) {
    const category = await this.categoryModel.findById(categoryId);
    if (!category) throw new NotFoundException('Category not found');

    if (category.image)
      await this.cloudinaryService.deleteFile(category.image).catch(() => null);

    const image = await this.cloudinaryService.uploadFile(
      file.buffer,
      'categories',
    );
    category.image = image.secure_url;

    await category.save();
    return { image: category.image };
  }

  async updateCategory(categoryId: string, body: UpdateCategoryDto) {
    const category = await this.categoryModel.findById(categoryId);
    if (!category) throw new NotFoundException('Category not found');

    if (body.parentId !== undefined) {
      if (body.parentId !== null) {
        if (body.parentId === categoryId)
          throw new BadRequestException('A category cannot be its own parent');
        const parent = await this.categoryModel.findById(body.parentId);
        if (!parent) throw new NotFoundException('Parent category not found');
      }
      category.parentId = body.parentId as never;
    }

    if (body.name && body.name !== category.name) {
      let slug = this.slugService.slugify(body.name);
      const existing = await this.categoryModel.findOne({
        slug,
        _id: { $ne: category._id },
      });
      if (existing)
        slug = this.slugService.uniqueSlug(
          body.name,
          Date.now().toString().slice(-4),
        );
      category.name = body.name;
      category.slug = slug;
    }

    if (body.isActive !== undefined) category.isActive = body.isActive;

    await category.save();
    return category;
  }

  async deleteCategory(categoryId: string) {
    const category = await this.categoryModel.findById(categoryId);
    if (!category) throw new NotFoundException('Category not found');

    const hasChildren = await this.categoryModel.findOne({
      parentId: categoryId,
    });
    if (hasChildren)
      throw new BadRequestException(
        'Cannot delete a category that has subcategories',
      );

    const hasProducts = await this.productModel.findOne({ categoryId });
    if (hasProducts)
      throw new BadRequestException(
        'Cannot delete a category that has products',
      );

    await category.deleteOne();
  }

  async listCategories(activeOnly = true) {
    const filter = activeOnly ? { isActive: true } : {};

    // We don't populate parentId here because building a nested tree
    // will inherently place children inside their actual parent objects.
    const categories = await this.categoryModel.find(filter).sort({ name: 1 });

    const categoryMap = new Map();
    const tree: Category[] = [];

    // First pass: map all categories by their stringified _id
    categories.forEach((doc) => {
      categoryMap.set(doc._id.toString(), { ...doc.toJSON(), children: [] });
    });

    // Second pass: place each category inside its parent's children array
    categoryMap.forEach((category) => {
      if (category.parentId) {
        const parentIdStr = category.parentId.toString();
        const parentNode = categoryMap.get(parentIdStr);

        if (parentNode) {
          parentNode.children.push(category);
        } else {
          // Parent might not exist (e.g. if activeOnly=true and parent is inactive)
          tree.push(category);
        }
      } else {
        tree.push(category); // No parentId means it's a top-level root
      }
    });

    return tree;
  }

  async getCategoryBySlug(slug: string) {
    const categories = await this.categoryModel.find({ isActive: true }).sort({
      name: 1,
    });
    const categoryMap = new Map();
    let targetCategory: any = null;

    // First pass: map all categories & find target
    categories.forEach((doc) => {
      const data = { ...doc.toJSON(), children: [] };
      if (data.slug === slug) targetCategory = data;
      categoryMap.set(doc._id.toString(), data);
    });

    if (!targetCategory) throw new NotFoundException('Category not found');

    // Second pass: nest children into their parents
    categories.forEach((doc) => {
      const category = categoryMap.get(doc._id.toString());
      if (category.parentId) {
        const parentIdStr = category.parentId.toString();
        const parentNode = categoryMap.get(parentIdStr);
        if (parentNode) {
          parentNode.children.push(category);
        }
      }
    });

    // Emulate the populate for the parentId of the target category
    if (targetCategory.parentId) {
      const parentNode = categoryMap.get(targetCategory.parentId.toString());
      if (parentNode) {
        targetCategory.parentId = {
          _id: parentNode._id,
          name: parentNode.name,
          slug: parentNode.slug,
        };
      }
    }

    return targetCategory;
  }

  async adminListCategories(query: AdminListCategoriesQueryDto) {
    const { skip, limit, page } = this.paginationService.getPagination(
      query.page,
      query.limit,
    );

    const filter: Record<string, unknown> = {};
    if (query.active) filter.isActive = query.active;

    const [categories, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .sort({ createdAt: -1 })
        .populate('parentId')
        .skip(skip)
        .limit(limit),
      this.categoryModel.countDocuments(filter),
    ]);

    return {
      categories,
      pagination: this.paginationService.buildPaginationMeta(
        total,
        page,
        limit,
      ),
    };
  }
}
