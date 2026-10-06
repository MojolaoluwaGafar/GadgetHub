import { useState } from "react";
import { Link } from "react-router";
import { Search, Users } from "lucide-react";
import { adminService } from "../../API/services/adminService";
import { useApiQuery } from "../../Hooks/Api/useApiQuery";
import { useDebounced } from "../../Hooks/useDebounced";
import { EmptyState, ErrorState, Pagination, Skeleton, TextInput } from "../../Components";
import { AdminHeading } from "../../Layout/AdminLayout";
import { formatDate, initials, naira } from "../../utils/format";

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const query = useDebounced(q);
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useApiQuery(() => adminService.customers({ q: query, page }), [query, page], "We couldn't load customers.");

  return (
    <div>
      <AdminHeading title="Customers" text="Everyone with a GadgetHub account." />
      <div className="rounded-md border border-[#e7e4e4] p-4">
        <TextInput
          id="customer-search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, email or phone…"
          icon={<Search className="h-4.5 w-4.5" />}
          aria-label="Search customers"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-[#e7e4e4]">
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.total === 0 ? (
          <EmptyState icon={<Users />} title={query ? "No customers match" : "No customers yet"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[#fff9f9] text-left text-[#7a7a7a]">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-5 py-3.5 font-medium">Phone</th>
                  <th className="px-5 py-3.5 font-medium">Joined</th>
                  <th className="px-5 py-3.5 text-right font-medium">Orders</th>
                  <th className="px-5 py-3.5 text-right font-medium">Total spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e4e4]">
                {loading && !data
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-5 py-3">
                          <Skeleton className="h-9" />
                        </td>
                      </tr>
                    ))
                  : data?.items.map((customer) => (
                      <tr key={customer.id} className="hover:bg-canvas">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">{initials(...customer.name.split(" "))}</span>
                            <span>
                              <span className="block font-medium">{customer.name}</span>
                              <span className="block text-xs text-muted">{customer.email}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">{customer.phoneNumber}</td>
                        <td className="px-5 py-3 text-[#605f5f]">{formatDate(customer.joinedAt)}</td>
                        <td className="px-5 py-3 text-right tabular-nums">
                          {customer.ordersCount > 0 ? (
                            <Link to={`/admin/orders?q=${encodeURIComponent(customer.email)}`} className="font-semibold text-brand hover:underline">
                              {customer.ordersCount}
                            </Link>
                          ) : (
                            0
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-medium">{naira(customer.totalSpent)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-6">
        <Pagination page={page} total={data?.total ?? 0} limit={PAGE_SIZE} onChange={setPage} />
      </div>
    </div>
  );
}
