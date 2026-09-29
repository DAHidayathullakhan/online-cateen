const Cart = {
  getItems() {
    const items = localStorage.getItem('cart_items');
    return items ? JSON.parse(items) : [];
  },
  saveItems(items) {
    localStorage.setItem('cart_items', JSON.stringify(items));
    this.updateCartBadge();
  },
  addItem(item) {
    let items = this.getItems();
    const existingIndex = items.findIndex(i => i._id === item._id || i.id === item.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity = (items[existingIndex].quantity || 1) + 1;
    } else {
      items.push({
        _id: item._id || item.id,
        name: item.name,
        price: item.price,
        image: item.image || '/images/food/default-food.svg',
        quantity: 1
      });
    }

    this.saveItems(items);
    showToast(`Added ${item.name} to cart`, 'success');
  },
  updateQuantity(id, delta) {
    let items = this.getItems();
    const index = items.findIndex(i => i._id === id);

    if (index > -1) {
      items[index].quantity += delta;
      if (items[index].quantity <= 0) {
        items.splice(index, 1);
      }
      this.saveItems(items);
    }
  },
  removeItem(id) {
    let items = this.getItems();
    items = items.filter(i => i._id !== id);
    this.saveItems(items);
  },
  clearCart() {
    localStorage.removeItem('cart_items');
    this.updateCartBadge();
  },
  getTotalCount() {
    const items = this.getItems();
    return items.reduce((total, i) => total + (i.quantity || 1), 0);
  },
  getSubtotal() {
    const items = this.getItems();
    return items.reduce((subtotal, i) => subtotal + (i.price * (i.quantity || 1)), 0);
  },
  updateCartBadge() {
    const count = this.getTotalCount();
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.innerText = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Cart.updateCartBadge();
});

window.Cart = Cart;
