import {
  addProductHandler,
  getAllProductsHandler,
  getProductByIdHandler,
  softDeleteProductHandler,
  updateProductHandler,
} from "../services/products.js";

export const addProduct = async (req, res) => {
  try {
    const { name, description, price, kitItems } = req.body;

    const image = req.files.mainImage?.[0]?.path; // main image
    const productImages = req.files.additionalImages
      ? req.files.additionalImages.map((file) => file.path)
      : [];

    const parsedKitItems = kitItems ? JSON.parse(kitItems) : [];

    const product = await addProductHandler({
      name,
      description,
      price,
      image,
      productImages,
      kitItems: parsedKitItems,
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("Error in addProduct:", error); // log the full error
    return res.status(500).json({ error: error.message });
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

export const softDeleteProduct = async (req, res) => {
  try {
    const product = await softDeleteProductHandler(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json({ message: "Product deleted (soft)", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.kitItems && typeof updates.kitItems === "string") {
      updates.kitItems = JSON.parse(updates.kitItems);
    }

    if (req.file) {
      updates.image = req.file.path;
    }

    const updated = await updateProductHandler(id, updates);
    if (!updated) return res.status(404).json({ error: "Product not found" });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
