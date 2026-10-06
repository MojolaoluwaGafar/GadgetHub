import type { AdminCustomer, AdminStats, Paginated } from "../types/shared";
import { Order } from "../Models/Order";
import { Product } from "../Models/Product";
import { User } from "../Models/User";
import { escapeRegex } from "../Utils/params";
import { toOrderDto, toProductSummary } from "./mappers";

const LOW_STOCK = 5;
const DAYS = 14;
// Days are counted in Lagos time, the shop's.
const TIMEZONE = "Africa/Lagos";

export async function stats(): Promise<AdminStats> {
  const since = new Date();
  since.setDate(since.getDate() - (DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const [revenueRow, ordersCount, pendingOrders, productsCount, lowStock, customersCount, dailyRows, recent] = await Promise.all([
    Order.aggregate<{ total: number }>([
      { $match: { paymentStatus: "paid", status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: ["pending", "processing"] } }),
    Product.countDocuments(),
    Product.find({ stock: { $lte: LOW_STOCK } }).sort({ stock: 1, name: 1 }).limit(6),
    User.countDocuments({ role: { $ne: "admin" } }),
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { createdAt: { $gte: since }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE } },
          revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] } },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(6),
  ]);

  // Every day in the range, including ones with no orders.
  const byDay = new Map(dailyRows.map((row) => [row._id, row]));
  const formatDay = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
  const daily = Array.from({ length: DAYS }, (_, index) => {
    const date = formatDay.format(new Date(Date.now() - (DAYS - 1 - index) * 86_400_000));
    const row = byDay.get(date);
    return { date, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
  });

  return {
    revenue: revenueRow[0]?.total ?? 0,
    ordersCount,
    pendingOrders,
    productsCount,
    lowStock: lowStock.map(toProductSummary),
    customersCount,
    daily,
    recentOrders: recent.map(toOrderDto),
  };
}

export async function customers(options: { q?: string; page: number; limit: number }): Promise<Paginated<AdminCustomer>> {
  const filter: Record<string, unknown> = { role: { $ne: "admin" } };
  const q = options.q?.trim().slice(0, 60);
  if (q) {
    const pattern = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ firstName: pattern }, { lastName: pattern }, { email: pattern }, { phoneNumber: pattern }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((options.page - 1) * options.limit).limit(options.limit),
    User.countDocuments(filter),
  ]);
  const totals = await Order.aggregate<{ _id: unknown; orders: number; spent: number }>([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    {
      $group: {
        _id: "$user",
        orders: { $sum: 1 },
        spent: { $sum: { $cond: [{ $and: [{ $eq: ["$paymentStatus", "paid"] }, { $ne: ["$status", "cancelled"] }] }, "$total", 0] } },
      },
    },
  ]);
  const byUser = new Map(totals.map((row) => [String(row._id), row]));

  return {
    items: users.map((user) => ({
      id: String(user._id),
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phoneNumber: user.phoneNumber,
      ordersCount: byUser.get(String(user._id))?.orders ?? 0,
      totalSpent: byUser.get(String(user._id))?.spent ?? 0,
      joinedAt: (user.createdAt ?? user._id.getTimestamp()).toISOString(),
    })),
    total,
    page: options.page,
    limit: options.limit,
  };
}
