import * as cartService from "../services/cart.js";

export const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, quantity } = req.body;

    const cart = await cartService.addToCart(userId, productId, quantity);
    res.status(200).json(cart);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.userId;
    const items = await cartService.getCartItems(userId);
    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to load cart" });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, quantity } = req.body;

    if (!productId || quantity == null) {
      return res
        .status(400)
        .json({ error: "Product ID and quantity required" });
    }

    const { cart, totalAmount } = await cartService.updateCartItemQuantity(
      userId,
      productId,
      quantity
    );

    res.status(200).json({
      message: "Cart updated",
      cart,
      totalAmount,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "Product ID required" });
    }

    const updatedCart = await cartService.removeFromCart(userId, productId);

    res.status(200).json({
      message: "Item removed from cart",
      cart: updatedCart,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
