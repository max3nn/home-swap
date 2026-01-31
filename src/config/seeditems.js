const Item = require('../models/Item');

const seedItems = async () => {
  // Only seed if there are no items
  const itemCount = await Item.countDocuments();
  if (itemCount === 0) {
    console.log('Seeding items...');

    const items = [
      {
        itemId: '1',
        title: 'Makita Batteries',
        description:
          '4x Makita batteries. 18V. 2x 5.0Ah and 2x 2.0Ah in good condition.\nPrepared to swap for astronomy equipment, or Milwaukee batteries.',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Lithium-Ion_Battery_Technology_%284016083577%29.png/640px-Lithium-Ion_Battery_Technology_%284016083577%29.png',
        hasImage: true,
        ownerId: '1',
        itemType: 'tools',
        wantedCategories: ['astronomy equipment', 'Milwaukee batteries'],
        status: 'available',
      },
      {
        itemId: '2',
        title: 'Pocket Lint',
        description:
          'A small collection of pocket lint from various trousers and jackets. Has absolutely no value but might be fun to swap for something equally useless.',
        hasImage: false,
        ownerId: '2',
        itemType: 'misc',
        wantedCategories: [],
        status: 'swapped', // This item was swapped with item 4
      },
      {
        itemId: '3',
        title: 'Candlesticks',
        description:
          'A pair of vintage brass candlesticks. Perfect for adding a touch of elegance to any room. Willing to swap for clothes, or kitchen knives.',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Unknown_artist_-_Candlesticks_-_1989.168_-_Cleveland_Museum_of_Art.jpg/640px-Unknown_artist_-_Candlesticks_-_1989.168_-_Cleveland_Museum_of_Art.jpg',
        hasImage: true,
        ownerId: '3',
        itemType: 'home decor',
        wantedCategories: ['clothes', 'kitchen knives'],
        status: 'available',
      },
      {
        itemId: '4',
        title: 'Kids balance bikes',
        description:
          'High quality kids balance bikes as pictured. Durable and safe for outdoor play. Looking to swap for indoor games, puzzles or books.',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Kids_bikes_balance.jpg/640px-Kids_bikes_balance.jpg',
        hasImage: true,
        ownerId: '4',
        itemType: 'toys',
        wantedCategories: ['indoor games', 'puzzles', 'books'],
        status: 'swapped', // This item was swapped with item 2
      },
      {
        itemId: '5',
        title: 'Vintage Cookbook Collection',
        description:
          'Collection of 12 vintage cookbooks from the 1970s-1980s. Great condition with some amazing recipes. Perfect for cooking enthusiasts.',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/4/46/1890_August_Kux_Kleines_Kochbuch_für_die_Bürgerliche_Küche%2C_Seite_00a_Einband-Titel.jpg',
        hasImage: true,
        ownerId: '1',
        itemType: 'books',
        wantedCategories: ['kitchen appliances', 'gardening tools'],
        status: 'available',
      },
      {
        itemId: '6',
        title: 'Board Game Collection',
        description:
          'Various board games including Monopoly, Scrabble, and Risk. All complete with pieces. Great for family game nights.',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/d/d3/Board_games_in_a_french_%28gamer%27s%29_house.jpg',
        hasImage: true,
        ownerId: '2',
        itemType: 'games',
        wantedCategories: ['electronics', 'sports equipment'],
        status: 'available',
      },
      {
        itemId: '7',
        title: 'Yoga Mat and Blocks',
        description:
          'High-quality yoga mat with matching blocks and strap. Barely used, perfect for starting your yoga journey.',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/1/18/Gaim_Yoga_Mat_1_2019-05-15.jpg',
        hasImage: true,
        ownerId: '3',
        itemType: 'sports',
        wantedCategories: ['books', 'art supplies'],
        status: 'available',
      },
      {
        itemId: '8',
        title: 'Plant Cuttings',
        description:
          'Various houseplant cuttings ready for propagation. Includes pothos, snake plant, and spider plant babies.',
        hasImage: false,
        ownerId: '4',
        itemType: 'plants',
        wantedCategories: ['pots', 'plant accessories'],
        status: 'available',
      },
    ];
    await Item.deleteMany({});
    await Item.insertMany(items);
  };
};

module.exports = seedItems;
