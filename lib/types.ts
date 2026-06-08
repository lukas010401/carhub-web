export type FuelType = 'Gasoline' | 'Diesel' | 'Hybrid' | 'Electric';
export type TransmissionType = 'Manual' | 'Automatic';
export type ListingStatus = 'Draft' | 'PendingReview' | 'Published' | 'Approved' | 'Rejected' | 'Archived' | 'Sold';

export interface MetadataItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  imageUrl?: string;
}

export interface PopularBrand {
  id: string;
  name: string;
  slug: string;
  listingsCount: number;
  logoUrl?: string;
  imageUrl?: string;
}

export interface PublicListing {
  id: string;
  title: string;
  price: number;
  year: number;
  mileage: number;
  fuelType: FuelType | string;
  transmissionType: TransmissionType | string;
  brand: string;
  model: string;
  city: string;
  category: string;
  coverImage?: string;
  publishedAt?: string;
  sellerAccountType?: 'Individual' | 'Professional' | string;
  accountType?: 'Individual' | 'Professional' | string;
  isProfessionalSeller?: boolean;
  seller?: {
    accountType?: 'Individual' | 'Professional' | string;
    isProfessional?: boolean;
  };
}

export interface SellerListing {
  id: string;
  title: string;
  price: number;
  year: number;
  mileage: number;
  status: ListingStatus | string;
  rejectionReason?: string;
  brand: string;
  model: string;
  coverImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminPendingListing {
  id: string;
  title: string;
  price: number;
  year: number;
  seller: string;
  brand: string;
  model: string;
  createdAt: string;
}

export interface ListingImage {
  id: string;
  url: string;
  displayOrder: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
}

export interface JwtUser {
  sub: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  whatsAppNumber?: string;
  profileImageUrl?: string;
  accountType?: 'Individual' | 'Professional' | string;
  role: 'Admin' | 'Seller' | string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PagedResult<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

export interface AdminKpis {
  pending: number;
  published: number;
  rejected: number;
  sold: number;
  siteVisits: number;
  sellerSignups: number;
}

export interface AdminLogItem {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  detailsJson?: string;
  createdAt: string;
}

export interface AdminListingItem {
  id: string;
  title: string;
  price: number;
  year: number;
  mileage: number;
  status: ListingStatus | string;
  rejectionReason?: string;
  publishedAt?: string;
  createdAt: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  brand: string;
  model: string;
  coverImage?: string;
}

export interface AdminListingDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  year: number;
  mileage: number;
  fuelType: FuelType | string;
  transmissionType: TransmissionType | string;
  engineSize?: string;
  color?: string;
  doors?: number;
  condition?: string;
  phoneNumber: string;
  whatsAppNumber?: string;
  status: ListingStatus | string;
  rejectionReason?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  seller: {
    sellerId: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    whatsAppNumber?: string;
  };
  brand: string;
  model: string;
  city: string;
  category: string;
  photos: ListingImage[];
}

export interface AdminDecisionItem {
  id: string;
  action: string;
  adminUserId: string;
  adminEmail: string;
  detailsJson?: string;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  whatsAppNumber?: string;
  role: 'Admin' | 'Seller' | string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ListingPayload {
  brandId: string;
  modelId: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: FuelType;
  transmissionType: TransmissionType;
  cityId: string;
  categoryId: string;
  title: string;
  description: string;
  engineSize?: string;
  color?: string;
  doors?: number;
  condition?: string;
  phoneNumber: string;
  whatsAppNumber?: string;
}





