const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
    {
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

        tradeType: {
            type: String,
            required: true,
            enum: ["BUY", "SELL"]
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 1
        },

        tradeValue: {
            type: Number,
            default: 0
        },

        tradeTime: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

tradeSchema.pre("save", function () {
    this.tradeValue = this.quantity * this.price;
});

module.exports = mongoose.model("Trade", tradeSchema);