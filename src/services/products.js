import Product from "../models/Products.js";

export const addProductHandler = async ({
  name,
  description,
  price,
  image,
  kitItems,
}) => {
  const product = new Product({ name, description, price, image, kitItems });
  return await product.save();
};

export const getAllProductsHandler = async () => {
  const products = await Product.find();
  return products.map((product) => product.toObject());
};

export const getProductByIdHandler = async (id) => {
  return await Product.findById(id);
};
