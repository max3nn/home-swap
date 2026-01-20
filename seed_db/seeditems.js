import mongoose from 'mongoose';

// Create itemSchema
const itemSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: false,
    },
    ownerId: {
        type: String,
        required: true,
    },
    itemType: {
        type: String,
        required: false,
    },
});

const Item = mongoose.model('Item', itemSchema);

const seedItems = async () => {
    const items = [
        {
            itemId: 1,
            title: 'Makita Batteries',
            description:
                '4x Makita batteries. 18V. 2x 5.0Ah and 2x 2.0Ah in good condition.\nPrepared to swap for astronomy equipment, or Milwaukee batteries.',
            imageUrl:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Lithium-Ion_Battery_Technology_%284016083577%29.png/640px-Lithium-Ion_Battery_Technology_%284016083577%29.png',
            ownerId: 1,
            itemType: 'tools',
        },
        {
            itemId: 2,
            title: 'Pocket Lint',
            description:
                'A small collection of pocket lint from various trousers and jackets. Has absolutely no value but might be fun to swap for something equally useless.',
            ownerId: 2,
        },
        {
            itemId: 3,
            title: 'Candlesticks',
            description:
                'A pair of vintage brass candlesticks. Perfect for adding a touch of elegance to any room. Willing to swap for clothes, or kitchen knives.',
            imageUrl:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Unknown_artist_-_Candlesticks_-_1989.168_-_Cleveland_Museum_of_Art.jpg/640px-Unknown_artist_-_Candlesticks_-_1989.168_-_Cleveland_Museum_of_Art.jpg',
            ownerId: 3,
            itemType: 'home decor',
        },
        {
            itemId: 4,
            title: 'Kids balance bikes',
            description:
                'High quality kids balance bikes as pictured. Durable and safe for outdoor play. Looking to swap for indoor games, puzzles or books.',
            imageUrl:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Kids_bikes_balance.jpg/640px-Kids_bikes_balance.jpg',
            ownerId: 4,
            itemType: 'toys',
        },
    ];
    await Item.deleteMany({});
    await Item.insertMany(items);
};

export default seedItems;
