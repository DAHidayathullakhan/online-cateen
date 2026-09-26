// Cart Management Client
const Cart = {
  getCart: () => JSON.parse(localStorage.getItem('canteen_cart')) || [],
  
  saveCart: (cart) => {
    localStorage.setItem('canteen_cart', JSON.stringify(cart));
    if (window.updateCartBadge) window.updateCartBadge();
  },

  addItem: (item, qty = 1) => {
    const cart = Cart.getCart();
    const existingIndex = cart.findIndex(i => i.menuItemId === (item._id || item.menuItemId));

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        menuItemId: item._id || item.menuItemId,
        name: item.name,
        price: item.price,
        image: item.image,
        isVegetarian: item.isVegetarian,
        quantity: qty
      });
    }

    Cart.saveCart(cart);
    showToast(`Added "${item.name}" to cart!`, 'success');
  },

  removeItem: (menuItemId) => {
    const cart = Cart.getCart().filter(i => i.menuItemId !== menuItemId);
    Cart.saveCart(cart);
  },

  updateQuantity: (menuItemId, delta) => {
    const cart = Cart.getCart();
    const item = cart.find(i => i.menuItemId === menuItemId);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        return Cart.removeItem(menuItemId);
      }
    }
    Cart.saveCart(cart);
  },

  clearCart: () => {
    localStorage.removeItem('canteen_cart');
    if (window.updateCartBadge) window.updateCartBadge();
  }
};

window.Cart = Cart;
