import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Order, OrderStatus } from '../orders/schemas/order.schema';
import { Product } from '../products/schemas/product.schema';

export interface DashboardResponse {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    lowStockCount: number;
    recentOrders: Array<{
        id: string;
        customerName: string;
        total: number;
        status: string;
        createdAt: Date;
    }>;
    salesChart: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
    comparisonStats: {
        revenue: {
            current: number;
            previous: number;
            percentageChange: number;
        };
        orders: {
            current: number;
            previous: number;
            percentageChange: number;
        };
        customers: {
            current: number;
            previous: number;
            percentageChange: number;
        };
    };
}

// Add this interface to properly type the lean order document
interface LeanOrder extends Document {
    _id: any;
    orderCreator: { name: string } | null;
    total: number;
    status: OrderStatus;
    createdAt: Date;
}

@Injectable()
export class StatisticsService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(Order.name) private readonly orderModel: Model<Order>,
        @InjectModel(Product.name) private readonly productModel: Model<Product>,
    ) { }

    async getDashboardStats() {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const [
            totalUsers,
            newUsersToday,
            newUsersThisMonth,
            totalOrders,
            ordersToday,
            ordersThisMonth,
            totalRevenue,
            revenueToday,
            revenueThisMonth,
            totalProducts,
            lowStockProducts,
            outOfStockProducts,
        ] = await Promise.all([
            // User statistics
            this.userModel.countDocuments(),
            this.userModel.countDocuments({ createdAt: { $gte: startOfDay } }),
            this.userModel.countDocuments({ createdAt: { $gte: startOfMonth } }),

            // Order statistics
            this.orderModel.countDocuments(),
            this.orderModel.countDocuments({ createdAt: { $gte: startOfDay } }),
            this.orderModel.countDocuments({ createdAt: { $gte: startOfMonth } }),

            // Revenue statistics
            this.orderModel.aggregate([
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]).then(result => result[0]?.total || 0),
            this.orderModel.aggregate([
                { $match: { createdAt: { $gte: startOfDay } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]).then(result => result[0]?.total || 0),
            this.orderModel.aggregate([
                { $match: { createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]).then(result => result[0]?.total || 0),

            // Product statistics
            this.productModel.countDocuments(),
            this.productModel.countDocuments({ stock: { $lt: 10, $gt: 0 } }),
            this.productModel.countDocuments({ stock: 0 }),
        ]);

        // Get top selling products
        const topSellingProducts = await this.orderModel.aggregate([
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.product',
                    totalQuantity: { $sum: '$products.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $project: {
                    name: '$productInfo.name',
                    totalQuantity: 1,
                    totalRevenue: 1
                }
            }
        ]);

        return {
            users: {
                total: totalUsers,
                newToday: newUsersToday,
                newThisMonth: newUsersThisMonth,
            },
            orders: {
                total: totalOrders,
                today: ordersToday,
                thisMonth: ordersThisMonth,
            },
            revenue: {
                total: totalRevenue,
                today: revenueToday,
                thisMonth: revenueThisMonth,
            },
            products: {
                total: totalProducts,
                lowStock: lowStockProducts,
                outOfStock: outOfStockProducts,
            },
            topSelling: topSellingProducts,
        };
    }

    async getRevenueStats(period: 'daily' | 'monthly' | 'yearly' = 'monthly') {
        const today = new Date();
        let startDate: Date;
        let dateFormat: { format: string; date: any };

        switch (period) {
            case 'daily':
                startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
                dateFormat = {
                    format: '%Y-%m-%d',
                    date: { $dateFromParts: { 
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    }}
                };
                break;
            case 'monthly':
                startDate = new Date(today.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // Last 12 months
                dateFormat = {
                    format: '%Y-%m',
                    date: { $dateFromParts: { 
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    }}
                };
                break;
            case 'yearly':
                startDate = new Date(today.getTime() - 5 * 365 * 24 * 60 * 60 * 1000); // Last 5 years
                dateFormat = {
                    format: '%Y',
                    date: { $dateFromParts: { 
                        year: { $year: '$createdAt' }
                    }}
                };
                break;
        }

        return this.orderModel.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: startDate } 
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        ...(period === 'daily' ? { day: { $dayOfMonth: '$createdAt' } } : {})
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: { $dateToString: dateFormat },
                    revenue: 1,
                    orders: 1
                }
            },
            { $sort: { date: 1 } }
        ]);
    }

    async getExtendedDashboardStats(): Promise<DashboardResponse> {
        const today = new Date();
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        // Get current month stats
        const [currentMonthRevenue, currentMonthOrders, currentMonthCustomers] = await Promise.all([
            this.orderModel.aggregate([
                { $match: { createdAt: { $gte: currentMonth } } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]).then(result => result[0]?.total || 0),
            this.orderModel.countDocuments({ createdAt: { $gte: currentMonth } }),
            this.userModel.countDocuments({ createdAt: { $gte: currentMonth } })
        ]);

        // Get previous month stats
        const [previousMonthRevenue, previousMonthOrders, previousMonthCustomers] = await Promise.all([
            this.orderModel.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: previousMonth,
                            $lt: currentMonth
                        }
                    }
                },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]).then(result => result[0]?.total || 0),
            this.orderModel.countDocuments({
                createdAt: {
                    $gte: previousMonth,
                    $lt: currentMonth
                }
            }),
            this.userModel.countDocuments({
                createdAt: {
                    $gte: previousMonth,
                    $lt: currentMonth
                }
            })
        ]);

        // Get recent orders with proper typing
        const recentOrders = await this.orderModel
            .find()
            .populate('orderCreator', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
            .then(orders => orders.map((order: any) => ({
                id: order._id.toString(),
                customerName: order.orderCreator?.name || 'Unknown',
                total: order.total || 0,
                status: order.status,
                createdAt: new Date(order.createdAt) // Convert to Date object
            })));

        // Get sales chart data (last 7 days)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const salesChart = await this.orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    revenue: 1,
                    orders: 1
                }
            }
        ]);

        // Fill in missing dates with zero values
        const fullSalesChart = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(sevenDaysAgo);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const existingData = salesChart.find(item => item.date === dateStr);

            fullSalesChart.push(existingData || {
                date: dateStr,
                revenue: 0,
                orders: 0
            });
        }

        // Calculate percentage changes
        const calculatePercentageChange = (current: number, previous: number) => {
            if (previous === 0) return 100;
            return Number(((current - previous) / previous * 100).toFixed(1));
        };

        return {
            totalRevenue: currentMonthRevenue,
            totalOrders: currentMonthOrders,
            totalCustomers: await this.userModel.countDocuments(),
            lowStockCount: await this.productModel.countDocuments({ stock: { $lt: 10, $gt: 0 } }),
            recentOrders,
            salesChart: fullSalesChart,
            comparisonStats: {
                revenue: {
                    current: currentMonthRevenue,
                    previous: previousMonthRevenue,
                    percentageChange: calculatePercentageChange(currentMonthRevenue, previousMonthRevenue)
                },
                orders: {
                    current: currentMonthOrders,
                    previous: previousMonthOrders,
                    percentageChange: calculatePercentageChange(currentMonthOrders, previousMonthOrders)
                },
                customers: {
                    current: currentMonthCustomers,
                    previous: previousMonthCustomers,
                    percentageChange: calculatePercentageChange(currentMonthCustomers, previousMonthCustomers)
                }
            }
        };
    }
} 