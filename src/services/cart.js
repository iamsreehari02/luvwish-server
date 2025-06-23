import Product from "../models/Products.js";
import Cart from "../models/Cart.js";

export const addToCart = async (userId, productId, quantity = 1) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity }],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();
  }

  return cart;
};

export const getCartItems = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) return [];

  return cart.items.map((item) => ({
    productId: item.product._id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    image: item.product.image,
    totalPrice: item.product.price * item.quantity,
  }));
};

export const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new Error("Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );

  await cart.save();

  return cart;
};

export const updateCartItemQuantity = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new Error("Product not found in cart");
  }

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  await cart.populate("items.product");

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  await cart.save();

  return { cart, totalAmount };
};
