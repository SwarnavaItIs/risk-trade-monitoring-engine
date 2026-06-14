const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        traderId: {
            type: String,
            required: true,
            trim: true
        },
        traderName: {
            type: String,
            required: true,
            trim: true
        },
        stockSymbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },
        side: {
            type: String,
            enum: ["BUY", "SELL"],
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0.01
        },
        orderValue: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ["SUBMITTED", "CANCELLED", "FILLED", "PARTIALLY_FILLED"],
            default: "SUBMITTED"
        },
        filledQuantity: {
            type: Number,
            default: 0,
            min: 0,
            validate: {
                validator: function (value) {
                    return value <= this.quantity;
                },
                message: "filledQuantity cannot exceed quantity"
            }
        },
        cancelledAt: {
            type: Date
        },
        filledAt: {
            type: Date
        },
        source: {
            type: String,
            enum: ["MANUAL", "CSV", "SYSTEM"],
            default: "MANUAL"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

orderSchema.pre("save", function () {
    this.orderValue = this.quantity * this.price;
});

orderSchema.index({ traderId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ stockSymbol: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
