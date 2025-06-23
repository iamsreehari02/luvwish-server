import Product from "../models/Products.js";

export const addProductHandler = async ({
  name,
  description,
  price,
  image,
  productImages,
  kitItems,
}) => {
  const product = new Product({
    name,
    description,
    price,
    image,
    productImages,
    kitItems,
  });

  return await product.save();
};

export const getAllProductsHandler = async () => {
  const products = await Product.find({ isDeleted: false });
  return products.map((product) => product.toObject());
};
export const getProductByIdHandler = async (id) => {
  return await Product.findById(id);
};

export const softDeleteProductHandler = async (productId) => {
  return await Product.findByIdAndUpdate(
    productId,
    { isDeleted: true },
    { new: true }
  );
};

export const updateProductHandler = async (productId, updateData) => {
  return await Product.findByIdAndUpdate(productId, updateData, { new: true });
};
