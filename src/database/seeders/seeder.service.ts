import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/schemas/user.schema';
import { Category } from '../../categories/schemas/category.schema';
import { Product } from '../../products/schemas/product.schema';
import { PromoCode } from '../../promo-codes/schemas/promo-code.schema';
import { Promotion } from '../../promotions/schemas/promotion.schema';
import { UserRole } from '../../common/interfaces/user-role.enum';

@Injectable()
export class SeederService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(PromoCode.name) private readonly promoCodeModel: Model<PromoCode>,
    @InjectModel(Promotion.name) private readonly promotionModel: Model<Promotion>,
  ) {}

  async seed() {
    await this.cleanDatabase();
    const admin = await this.seedUsers();
    const categories = await this.seedCategories();
    await this.seedProducts(categories);
    await this.seedPromoCodes();
    await this.seedPromotions();
    return 'Database seeded successfully!';
  }

  private async cleanDatabase() {
    await Promise.all([
      this.userModel.deleteMany({}),
      this.categoryModel.deleteMany({}),
      this.productModel.deleteMany({}),
      this.promoCodeModel.deleteMany({}),
      this.promotionModel.deleteMany({}),
    ]);
  }

  private async seedUsers() {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await this.userModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await this.userModel.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: hashedPassword,
      role: UserRole.USER,
    });

    return admin;
  }

  private async seedCategories() {
    const categories = await this.categoryModel.create([
      {
        name: 'Electronics',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
        description: 'Latest gadgets and electronic devices',
      },
      {
        name: 'Fashion',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
        description: 'Trendy clothing and accessories',
      },
      {
        name: 'Home & Living',
        image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800',
        description: 'Furniture and home decor',
      },
      {
        name: 'Sports & Outdoors',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
        description: 'Sports equipment and outdoor gear',
      },
      {
        name: 'Beauty & Health',
        image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800',
        description: 'Beauty products and health essentials',
      }
    ]);

    return categories;
  }

  private async seedProducts(categories: Category[]) {
    const categoryProducts = {
      Electronics: [
        // Smartphones
        {
          name: 'Premium Smartphone X',
          description: 'Latest flagship smartphone with advanced camera system',
          mainImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
          images: [
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'
          ],
          buyPrice: 699,
          sellPrice: 999.99,
          isOnFlash: true,
          flashPrice: 849.99,
          stock: 50,
          isFeatured: true
        },
        // Laptops
        {
          name: 'Ultra Slim Laptop Pro',
          description: 'Powerful laptop for professionals',
          mainImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
          images: [
            'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=800',
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'
          ],
          buyPrice: 899,
          sellPrice: 1299.99,
          stock: 30,
          isFeatured: true
        },
        // ... add 18 more electronics products
      ],
      Fashion: [
        // Men's Clothing
        {
          name: 'Classic Leather Jacket',
          description: 'Premium leather jacket for men',
          mainImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          images: [
            'https://images.unsplash.com/photo-1509957228579-c67a3298ad21?w=800',
            'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800'
          ],
          buyPrice: 150,
          sellPrice: 299.99,
          isOnFlash: true,
          flashPrice: 249.99,
          stock: 40,
          isFeatured: true
        },
        // Women's Clothing
        {
          name: 'Designer Summer Dress',
          description: 'Elegant summer dress for women',
          mainImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
          images: [
            'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=800',
            'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800'
          ],
          buyPrice: 89,
          sellPrice: 179.99,
          stock: 60
        },
        // ... add 18 more fashion products
      ],
      'Home & Living': [
        // Furniture
        {
          name: 'Modern Sofa Set',
          description: 'Contemporary 3-seater sofa with ottoman',
          mainImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
          images: [
            'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800',
            'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800'
          ],
          buyPrice: 799,
          sellPrice: 1499.99,
          isOnFlash: true,
          flashPrice: 1299.99,
          stock: 15,
          isFeatured: true
        },
        // Kitchen
        {
          name: 'Premium Coffee Maker',
          description: 'Professional grade coffee machine',
          mainImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
          images: [
            'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800',
            'https://images.unsplash.com/photo-1522012188892-24beb302783d?w=800'
          ],
          buyPrice: 199,
          sellPrice: 399.99,
          stock: 25
        },
        // ... add 18 more home & living products
      ],
      'Sports & Outdoors': [
        // Fitness Equipment
        {
          name: 'Smart Fitness Watch',
          description: 'Advanced fitness tracker with heart rate monitoring',
          mainImage: 'https://images.unsplash.com/photo-1557166983-5939644443a3?w=800',
          images: [
            'https://images.unsplash.com/photo-1557166877-7a7b05bb108c?w=800',
            'https://images.unsplash.com/photo-1557166877-7a7b05bb108c?w=800'
          ],
          buyPrice: 129,
          sellPrice: 249.99,
          isOnFlash: true,
          flashPrice: 199.99,
          stock: 100,
          isFeatured: true
        },
        // ... add 19 more sports products
      ],
      'Beauty & Health': [
        // Skincare
        {
          name: 'Premium Skincare Set',
          description: 'Complete skincare routine package',
          mainImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
          images: [
            'https://images.unsplash.com/photo-1556228841-a3c527ebefe5?w=800',
            'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800'
          ],
          buyPrice: 89,
          sellPrice: 179.99,
          isOnFlash: true,
          flashPrice: 149.99,
          stock: 75,
          isFeatured: true
        },
        // ... add 19 more beauty & health products
      ]
    };

    // Generate more products for each category
    const generateMoreProducts = (category: string, baseProducts: any[]) => {
      const products = [...baseProducts];
      const count = 20 - baseProducts.length; // Ensure 20 products per category

      for (let i = 0; i < count; i++) {
        const baseProduct = baseProducts[i % baseProducts.length];
        products.push({
          ...baseProduct,
          name: `${baseProduct.name} ${i + 1}`,
          buyPrice: baseProduct.buyPrice * (0.8 + Math.random() * 0.4),
          sellPrice: baseProduct.sellPrice * (0.8 + Math.random() * 0.4),
          isOnFlash: Math.random() > 0.8,
          isFeatured: Math.random() > 0.8,
          stock: Math.floor(Math.random() * 100) + 10
        });
      }
      return products;
    };

    const products = [];
    for (const category of categories) {
      const categoryName = category.name as keyof typeof categoryProducts;
      const baseProducts = categoryProducts[categoryName] || [];
      const expandedProducts = generateMoreProducts(categoryName, baseProducts);
      
      products.push(
        ...expandedProducts.map(product => ({
          ...product,
          category: category.id,
          flashPrice: product.isOnFlash ? product.sellPrice * 0.8 : undefined
        }))
      );
    }

    await this.productModel.create(products);
  }

  private async seedPromoCodes() {
    await this.promoCodeModel.create([
      {
        code: 'WELCOME10',
        description: 'Get 10% off on your first purchase',
        percentage: 10,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        code: 'SUMMER20',
        description: 'Summer special discount',
        percentage: 20,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
    ]);
  }

  private async seedPromotions() {
    await this.promotionModel.create([
      {
        title: 'Summer Sale',
        description: 'Get up to 50% off on summer collection',
        bannerImg: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1000',
        isActive: true
      },
      {
        title: 'Flash Deals',
        description: 'Limited time offers on premium products',
        bannerImg: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1000',
        isActive: true
      },
      {
        title: 'Black Friday',
        description: 'Biggest sale of the year - Up to 70% off',
        bannerImg: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1000',
        isActive: true
      },
      {
        title: 'Tech Bonanza',
        description: 'Amazing deals on latest gadgets',
        bannerImg: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000',
        isActive: true
      },
      {
        title: 'Fashion Week Special',
        description: 'Exclusive discounts on designer brands',
        bannerImg: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000',
        isActive: true
      },
      {
        title: 'Home Makeover Sale',
        description: 'Transform your space with incredible offers',
        bannerImg: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1000',
        isActive: true
      },
      {
        title: 'Sports & Fitness',
        description: 'Get fit with amazing deals on sports equipment',
        bannerImg: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1000',
        isActive: true
      },
      {
        title: 'Beauty Essentials',
        description: 'Special offers on premium beauty products',
        bannerImg: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1000',
        isActive: true
      },
      {
        title: 'Clearance Sale',
        description: 'Last chance to grab your favorites',
        bannerImg: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1000',
        isActive: false
      },
      {
        title: 'New Year Special',
        description: 'Start your year with amazing deals',
        bannerImg: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=1000',
        isActive: false
      }
    ]);
  }
} 