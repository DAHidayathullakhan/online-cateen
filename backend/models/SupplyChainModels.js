const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, default: 'kg' }, // e.g., kg, L, pcs, packets
    quantity: { type: Number, required: true, default: 0, min: 0 },
    minStock: { type: Number, default: 10 },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    supplier: { type: String }
  },
  { timestamps: true }
);

const recipeSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true, unique: true },
    ingredients: [
      {
        ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
        quantityRequired: { type: Number, required: true } // per single portion
      }
    ]
  },
  { timestamps: true }
);

const holidaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    title: { type: String, required: true },
    type: { type: String, enum: ['Holiday', 'Exam Day', 'Vacation', 'Special Event'], default: 'Holiday' },
    isOrderingDisabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const eventCateringSchema = new mongoose.Schema(
  {
    eventTitle: { type: String, required: true },
    department: { type: String, required: true },
    guestCount: { type: Number, required: true },
    eventDate: { type: String, required: true },
    eventTime: { type: String, required: true },
    location: { type: String, required: true },
    items: [
      {
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
        name: String,
        quantity: Number
      }
    ],
    assignedBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    specialRequirements: String,
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Preparing', 'Delivered', 'Cancelled'],
      default: 'Requested'
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactPerson: String,
    email: String,
    phone: String,
    suppliedIngredients: [{ type: String }],
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  { timestamps: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    items: [
      {
        ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
        name: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number
      }
    ],
    totalCost: { type: Number, required: true },
    orderedDate: { type: Date, default: Date.now },
    expectedDate: Date,
    receivedDate: Date,
    status: {
      type: String,
      enum: ['Draft', 'Ordered', 'Received', 'Cancelled'],
      default: 'Ordered'
    }
  },
  { timestamps: true }
);

module.exports = {
  Ingredient: mongoose.model('Ingredient', ingredientSchema),
  Recipe: mongoose.model('Recipe', recipeSchema),
  Holiday: mongoose.model('Holiday', holidaySchema),
  EventCatering: mongoose.model('EventCatering', eventCateringSchema),
  Vendor: mongoose.model('Vendor', vendorSchema),
  PurchaseOrder: mongoose.model('PurchaseOrder', purchaseOrderSchema)
};
