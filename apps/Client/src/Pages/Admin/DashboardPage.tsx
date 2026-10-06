import { Link } from "react-router";
import { AlertTriangle, Banknote, Clock, Package, ShoppingBag, Users } from "lucide-react";
import { adminService } from "../../API/services/adminService";
import { useApiQuery } from "../../Hooks/Api/useApiQuery";
import { useAuth } from "../../Context/AuthContext";
import { ErrorState, PageLoader, StatusBadge, StockBadge } from "../../Components";
import RevenueChart from "../../Components/Admin/RevenueChart";
import Button from "../../Components/Button";
import { formatDate, naira } from "../../utils/format";

function Stat({ icon: Icon, label, value, to }: { icon: typeof Banknote; label: string; value: string; to?: string }) {
  const body = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-sm text-muted">{label}</span>
        <span className="block text-2xl font-semibold tabular-nums">{value}</span>
      </span>
    </>
  );
  const classes = "flex items-center gap-4 rounded-md border border-[#e6e3e3] p-5";
  return to ? (
    <Link to={to} className={`${classes} transition-colors hover:border-brand`}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading, refetch } = useApiQuery(() => adminService.stats(), [], "We couldn't load the dashboard.");

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ""} onRetry={refetch} />;

  const fortnight = data.daily.reduce((sum, day) => sum + day.revenue, 0);

  return (
    <div className="space-y-6">
      <h1 className="py-1 text-2xl font-semibold">Dashboard</h1>
      <div className="flex h-[100px] flex-col justify-center rounded-md bg-brand px-5 text-white">
        <h2 className="text-xl font-semibold">Welcome back, Admin {user?.firstName} 👋</h2>
        <p>Here’s a quick snapshot of your Orders.</p>
      </div>

      {data.productsCount === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-brand-tint bg-brand-soft p-5">
          <div>
            <p className="font-semibold">Your shop has no products yet</p>
            <p className="text-sm text-muted">Add your first product and it appears in the shop straight away.</p>
          </div>
          <Button to="/admin/products/new">Add a product</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={Banknote} label="Revenue (paid)" value={naira(data.revenue)} />
        <Stat icon={ShoppingBag} label="Total orders" value={data.ordersCount.toLocaleString()} to="/admin/orders" />
        <Stat icon={Clock} label="To fulfil" value={data.pendingOrders.toLocaleString()} to="/admin/orders" />
        <Stat icon={Package} label="Products" value={data.productsCount.toLocaleString()} to="/admin/products" />
        <Stat icon={Users} label="Customers" value={data.customersCount.toLocaleString()} to="/admin/customers" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-md border border-[#e6e3e3] p-5">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Revenue, last 14 days</h2>
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{naira(fortnight)}</span> paid
            </p>
          </div>
          <RevenueChart daily={data.daily} />
        </section>

        <section className="rounded-md border border-[#e6e3e3] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-warning" /> Low stock
            </h2>
            <Link to="/admin/products?stock=low" className="text-sm font-semibold text-brand hover:underline">
              View all
            </Link>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-muted">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.lowStock.map((product) => (
                <li key={product.id}>
                  <Link to={`/admin/products/${product.id}/edit`} className="flex items-center gap-3 py-2.5 hover:text-brand">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-panel">{product.image && <img src={product.image} alt="" className="h-full w-full object-cover" />}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</span>
                    <StockBadge stock={product.stock} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-md border border-[#e6e3e3]">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm font-semibold text-brand hover:underline">
            View all
          </Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-[#fff9f9] text-left text-[#7a7a7a]">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e4e4]">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-canvas">
                    <td className="px-5 py-3 font-medium">
                      <Link to={`/admin/orders/${order.id}`} className="text-brand hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      {order.customer.firstName} {order.customer.lastName}
                    </td>
                    <td className="px-5 py-3 text-[#605f5f]">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{naira(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
