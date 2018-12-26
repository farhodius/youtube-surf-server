export interface Resource {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  resourceType: string;
  saved: boolean;
  thumbnails: { sm: { url: '' }; md: { url: '' }; lg: { url: '' } };
}
