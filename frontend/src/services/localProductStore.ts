import type { Product, Category } from '../types';

const PRODUCTS_KEY = 'egf_local_products';
const ID_KEY = 'egf_product_next_id';

/* ── Helpers ── */
const nextId = (): number => {
  const n = parseInt(localStorage.getItem(ID_KEY) || '1000', 10) + 1;
  localStorage.setItem(ID_KEY, String(n));
  return n;
};

const slugify = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

/* Resize image to max 800px wide before storing as base64 */
const resizeImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });

/* ── Read ── */
export const getLocalProducts = (): Product[] => {
  try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]'); } catch { return []; }
};

const save = (products: Product[]) =>
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));

/* ── Create ── */
export const addLocalProduct = async (
  form: { name: string; description: string; price: string; stock: string; category: string; available: boolean },
  imageFile: File | null,
  existingImageUrl: string,
  categories: Category[]
): Promise<Product> => {
  let image = existingImageUrl;
  if (imageFile) image = await resizeImage(imageFile);

  const cat = categories.find(c => String(c.id) === form.category);

  const product: Product = {
    id: nextId(),
    name: form.name.trim(),
    slug: slugify(form.name.trim()),
    description: form.description.trim(),
    price: parseFloat(form.price) || 0,
    stock: parseInt(form.stock, 10) || 0,
    available: form.available,
    image,
    category: cat ?? { id: 0, name: 'Uncategorized', slug: 'uncategorized' },
    created_at: new Date().toISOString(),
  };

  const products = getLocalProducts();
  products.unshift(product);
  save(products);
  return product;
};

/* ── Update ── */
export const updateLocalProduct = async (
  id: number,
  form: { name: string; description: string; price: string; stock: string; category: string; available: boolean },
  imageFile: File | null,
  existingImageUrl: string,
  categories: Category[]
): Promise<Product> => {
  const products = getLocalProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Not found');

  // Start with the currently stored image so edits never accidentally blank it
  let image = products[idx].image;
  if (imageFile) {
    image = await resizeImage(imageFile);
  } else if (existingImageUrl && (existingImageUrl.startsWith('data:') || existingImageUrl.startsWith('http'))) {
    image = existingImageUrl;
  }

  const cat = categories.find(c => String(c.id) === form.category);

  const updated: Product = {
    ...products[idx],
    name: form.name.trim(),
    slug: slugify(form.name.trim()),
    description: form.description.trim(),
    price: parseFloat(form.price) || 0,
    stock: parseInt(form.stock, 10) || 0,
    available: form.available,
    image,
    category: cat ?? products[idx].category,
  };

  products[idx] = updated;
  save(products);
  return updated;
};

/* ── Toggle available ── */
export const toggleLocalAvailable = (id: number): void => {
  const products = getLocalProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return;
  products[idx] = { ...products[idx], available: !products[idx].available };
  save(products);
};

/* ── Delete ── */
export const deleteLocalProduct = (id: number): void => {
  save(getLocalProducts().filter(p => p.id !== id));
};

/* ── Lookup single ── */
export const getLocalProduct = (id: number | string): Product | undefined =>
  getLocalProducts().find(p => p.id === Number(id));
