import {
  addProductHandler,
  getAllProductsHandler,
  getProductByIdHandler,
} from "../services/products.js";

export const addProduct = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const image = req.file?.path;

    const product = await addProductHandler({
      name,
      description,
      price,
      image,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await getAllProductsHandler();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await getProductByIdHandler(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
