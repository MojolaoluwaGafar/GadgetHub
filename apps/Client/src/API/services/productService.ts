import api from "../index";
import type {
  CatalogFacets,
  Category,
  Paginated,
  ProductDetail,
  ProductSort,
  ProductSummary,
  Review,
  ReviewList,
  StoreConfig,
} from "../../types";

export interface ProductQuery {
  q?: string;
  category?: Category | "";
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  trending?: boolean;
  ids?: string[];
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

// Leaves out empty values, and sends flags as 1 and lists comma separated.
export const toParams = ({ brands, ids, inStock, onSale, trending, ...rest }: ProductQuery) => ({
  ...rest,
  q: rest.q?.trim() || undefined,
  category: rest.category || undefined,
  brand: brands?.length ? brands.join(",") : undefined,
  ids: ids?.join(","),
  inStock: inStock ? 1 : undefined,
  onSale: onSale ? 1 : undefined,
  trending: trending ? 1 : undefined,
});

export const productService = {
  async list(query: ProductQuery): Promise<Paginated<ProductSummary>> {
    const { data } = await api.get<Paginated<ProductSummary>>("/api/products", { params: toParams(query) });
    return data;
  },

  /** The given products, in the order asked for; ones that no longer exist are left out. */
  async byIds(ids: string[]): Promise<ProductSummary[]> {
    if (!ids.length) return [];
    const { items } = await productService.list({ ids, limit: 48 });
    const byId = new Map(items.map((product) => [product.id, product]));
    return ids.map((id) => byId.get(id)).filter((product): product is ProductSummary => Boolean(product));
  },

  async facets(): Promise<CatalogFacets> {
    const { data } = await api.get<CatalogFacets>("/api/products/facets");
    return data;
  },

  async get(id: string): Promise<ProductDetail> {
    const { data } = await api.get<{ product: ProductDetail }>(`/api/products/${id}`);
    return data.product;
  },

  async related(id: string): Promise<ProductSummary[]> {
    const { data } = await api.get<{ products: ProductSummary[] }>(`/api/products/${id}/related`);
    return data.products;
  },

  async reviews(id: string, page = 1): Promise<ReviewList> {
    const { data } = await api.get<ReviewList>(`/api/products/${id}/reviews`, { params: { page } });
    return data;
  },

  async addReview(id: string, input: { rating: number; title: string; body: string }): Promise<Review> {
    const { data } = await api.post<{ review: Review }>(`/api/products/${id}/reviews`, input);
    return data.review;
  },

  async config(): Promise<StoreConfig> {
    const { data } = await api.get<StoreConfig>("/api/config");
    return data;
  },
};
