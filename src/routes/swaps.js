const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const SwapRequest = require('../models/SwapRequest');
const Item = require('../models/Item');
const User = require('../models/User');
const { createItem } = require('./items');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        if (!file || !file.mimetype) return cb(null, true);
        if (file.mimetype.startsWith('image/')) return cb(null, true);
        return cb(new Error('Only image uploads are allowed'));
    },
});

// Middleware to ensure user is logged in
router.use((req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
});

// GET /swaps/received - Show swap requests received by the user
router.get('/received', async (req, res, next) => {
    try {
        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        // Get swap requests where the user is the receiver
        const swapRequests = await SwapRequest.find({
            receiverId: req.session.user.userId
        }).lean();
        

        // Get associated items for each request
        const itemIds = [...new Set([
            ...swapRequests.map(req => req.itemId),
            ...swapRequests.map(req => req.offeredItemId)
        ])];

        const items = await Item.find({ itemId: { $in: itemIds } }).lean();
        const itemsMap = items.reduce((acc, item) => {
            acc[item.itemId] = item;

            return acc;
        }, {});

        // Get owner information for all items
        const ownerIds = [...new Set(items.map(item => item.ownerId))];
        
        // Get requester and receiver information from swap requests
        const requesterIds = [...new Set(swapRequests.map(req => req.requesterId).filter(Boolean))];
        const receiverIds = [...new Set(swapRequests.map(req => req.receiverId).filter(Boolean))];
        const allUserIds = [...new Set([...ownerIds, ...requesterIds, ...receiverIds])];
        
        const users = await User.find({ userId: { $in: allUserIds } }, { username: 1, userId: 1 }).lean();
        const userMap = users.reduce((map, user) => {
            map[user.userId] = user.username;
            return map;
        }, {});

        // Enrich swap requests with item data and owner names
        const enrichedRequests = swapRequests.map(request => ({
            ...request,
            targetItem: {
                ...itemsMap[request.itemId],
                ownerName: userMap[itemsMap[request.itemId]?.ownerId] || 'Unknown User',
                ownerId: itemsMap[request.itemId]?.ownerId || null
            },
            offeredItem: {
                ...itemsMap[request.offeredItemId],
                ownerName: userMap[itemsMap[request.offeredItemId]?.ownerId] || 'Unknown User',
                ownerId: itemsMap[request.offeredItemId]?.ownerId || null
            },
            requesterId: request.requesterId,
            receiverId: request.receiverId,
            requesterName: userMap[request.requesterId] || 'Unknown User',
            receiverName: userMap[request.receiverId] || 'Unknown User',
            isRequester: request.offeredItemId == req.session.user.userId ? true : false
        }));

        res.render('swap-received', {
            title: 'Received Swap Requests',
            swapRequests: enrichedRequests
        });
    } catch (err) {
        return next(err);
    }
});

// GET /swaps/my-requests - Show user's outgoing swap requests
router.get('/my-requests', async (req, res, next) => {
    try {
        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        // Get user's swap requests where they are the requester
        const swapRequests = await SwapRequest.find({
            requesterId: req.session.user.userId
        }).lean();

        var isTheRequester = true;

        // Get associated items for each request
        const itemIds = [...new Set([
            ...swapRequests.map(req => req.itemId),
            ...swapRequests.map(req => req.offeredItemId)
        ])];

        const items = await Item.find({ itemId: { $in: itemIds } }).lean();
        const itemsMap = items.reduce((acc, item) => {
            acc[item.itemId] = item;
            return acc;
        }, {});

        // Get owner information for all items
        const ownerIds = [...new Set(items.map(item => item.ownerId))];
        
        // Get requester and receiver information from swap requests
        const requesterIds = [...new Set(swapRequests.map(req => req.requesterId).filter(Boolean))];
        const receiverIds = [...new Set(swapRequests.map(req => req.receiverId).filter(Boolean))];
        const allUserIds = [...new Set([...ownerIds, ...requesterIds, ...receiverIds])];
        
        const users = await User.find({ userId: { $in: allUserIds } }, { username: 1, userId: 1 }).lean();
        const userMap = users.reduce((map, user) => {
            map[user.userId] = user.username;
            return map;
        }, {});

        // Enrich swap requests with item data and owner names
        const enrichedRequests = swapRequests.map(request => ({
            ...request,
            targetItem: {
                ...itemsMap[request.itemId],
                ownerName: userMap[itemsMap[request.itemId]?.ownerId] || 'Unknown User',
                ownerId: itemsMap[request.itemId]?.ownerId || null
            },
            offeredItem: {
                ...itemsMap[request.offeredItemId],
                ownerName: userMap[itemsMap[request.offeredItemId]?.ownerId] || 'Unknown User',
                ownerId: itemsMap[request.offeredItemId]?.ownerId || null
            },
            requesterId: request.requesterId,
            receiverId: request.receiverId,
            requesterName: userMap[request.requesterId] || 'Unknown User',
            receiverName: userMap[request.receiverId] || 'Unknown User',
            isRequester: itemsMap[request.offeredItemId]?.ownerId == req.session.user.userId ? true : false
        }));

        res.render('swap-my-requests', {
            title: 'My Swap Requests',
            swapRequests: enrichedRequests
        });
    } catch (err) {
        return next(err);
    }
});

// GET /swaps/:itemId - Show swap request form
router.get('/:itemId', async (req, res, next) => {
    try {
        const { itemId } = req.params;

        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        // Get the item
        const item = await Item.findOne({ itemId }).lean();
        if (!item) {
            return res.status(404).render('error', {
                title: 'Item Not Found',
                message: 'The item you are trying to swap with does not exist.',
                error: {},
            });
        }

        // Get the owner information
        const User = require('../models/User');
        const owner = await User.findOne({ userId: item.ownerId }, { username: 1, userId: 1 }).lean();
        const itemWithOwner = {
            ...item,
            ownerName: owner ? owner.username : 'Unknown User'
        };

        // Prevent swapping with already swapped items
        if (itemWithOwner.status === 'swapped') {
            return res.status(400).render('error', {
                title: 'Item Already Swapped',
                message: 'This item has already been swapped and is no longer available.',
                error: {},
            });
        }

        // Prevent users from requesting to swap with their own items
        if (itemWithOwner.ownerId === req.session.user.userId) {
            return res.status(400).render('error', {
                title: 'Invalid Request',
                message: 'You cannot request to swap with your own item.',
                error: {},
            });
        }

        // Get user's items for the swap offer
        const userItems = await Item.find({ ownerId: req.session.user.userId }).lean();
        const { ITEM_CATEGORIES } = require('../config/itemCategories');

        res.render('swap-request', {
            title: 'Request Swap',
            item: itemWithOwner,
            userItems,
            categories: ITEM_CATEGORIES,
            errors: [],
        });
    } catch (err) {
        return next(err);
    }
});

// POST /swaps/:itemId - Process swap request
router.post('/:itemId', upload.single('image'), async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { offeredItemId, message, createNewItem, title, description, itemType, imageUrl } = req.body;
        const errors = [];

        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        // Validate input
        if (!offeredItemId && !createNewItem) {
            errors.push('Please select an existing item or create a new one to offer for the swap.');
        }
        if (!message || message.trim().length < 1) {
            errors.push('Please provide a message for your swap request.');
        }
        if (message && message.length > 1000) {
            errors.push('Message must be less than 1000 characters.');
        }

        // Get the target item
        const targetItem = await Item.findOne({ itemId }).lean();
        if (!targetItem) {
            return res.status(404).render('error', {
                title: 'Item Not Found',
                message: 'The item you are trying to swap with does not exist.',
                error: {},
            });
        }

        // Prevent swapping with already swapped items
        if (targetItem.status === 'swapped') {
            return res.status(400).render('error', {
                title: 'Item Already Swapped',
                message: 'This item has already been swapped and is no longer available.',
                error: {},
            });
        }

        // Prevent users from requesting to swap with their own items
        if (targetItem.ownerId === req.session.user.userId) {
            return res.status(400).render('error', {
                title: 'Invalid Request',
                message: 'You cannot request to swap with your own item.',
                error: {},
            });
        }

        let offeredItem = null;

        if (createNewItem) {
            // Create a new item using shared function
            const itemResult = await createItem({
                title: title?.trim(),
                description: description?.trim(),
                itemType: itemType?.trim(),
                ownerId: req.session.user.userId
            }, req.file, imageUrl?.trim());

            if (!itemResult.success) {
                errors.push(...itemResult.errors);
            } else {
                offeredItem = itemResult.item;
            }
        } else {
            // Get the offered item
            offeredItem = await Item.findOne({
                itemId: offeredItemId,
                ownerId: req.session.user.userId
            }).lean();
            if (!offeredItem) {
                errors.push('Invalid item selection. Please choose one of your own items.');
            }
        }

        if (errors.length > 0) {
            const userItems = await Item.find({ ownerId: req.session.user.userId }).lean();
            const { ITEM_CATEGORIES } = require('../config/itemCategories');
            return res.render('swap-request', {
                title: 'Request Swap',
                item: targetItem,
                userItems,
                categories: ITEM_CATEGORIES,
                errors,
                formData: { offeredItemId, message, createNewItem, title, description, itemType, imageUrl }
            });
        }

        // Check for existing swap request
        const existingRequest = await SwapRequest.findOne({
            itemId: targetItem.itemId,
            ownerId: req.session.user.userId,
            offeredItemId: offeredItem.itemId
        }).lean();

        if (existingRequest) {
            errors.push('You have already made a swap request for this item with the selected offering.');
            const userItems = await Item.find({ ownerId: req.session.user.userId }).lean();
            const { ITEM_CATEGORIES } = require('../config/itemCategories');
            return res.render('swap-request', {
                title: 'Request Swap',
                item: targetItem,
                userItems,
                categories: ITEM_CATEGORIES,
                errors,
                formData: { offeredItemId, message, createNewItem, title, description, itemType }
            });
        }

        // Create swap request
        const swapRequest = new SwapRequest({
            swapRequestId: uuidv4(),
            itemId: targetItem.itemId,
            message: message.trim(),
            imageUrl: offeredItem.imageUrl || (offeredItem.hasImage && offeredItem.image ? `/items/${offeredItem.itemId}/image` : null),
            requesterId: req.session.user.userId,
            receiverId: targetItem.ownerId,
            ownerId: req.session.user.userId,
            offeredItemId: offeredItem.itemId,
            status: 'pending',
            createdAt: new Date(),
        });

        await swapRequest.save();

        req.session.success = 'Swap request sent successfully!';
        res.redirect('/search');
    } catch (err) {
        return next(err);
    }
});

// PUT /swaps/:swapRequestId/accept - Accept a swap request
router.put('/:swapRequestId/accept', async (req, res, next) => {
    try {
        const { swapRequestId } = req.params;

        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        const swapRequest = await SwapRequest.findOne({ swapRequestId });
        if (!swapRequest) {
            return res.status(404).render('error', {
                title: 'Swap Request Not Found',
                message: 'The swap request you are trying to accept does not exist.',
                error: {},
            });
        }

        // Only the receiver can accept the request
        if (swapRequest.receiverId !== req.session.user.userId) {
            return res.status(403).render('error', {
                title: 'Unauthorized',
                message: 'You are not authorized to accept this swap request.',
                error: {},
            });
        }

        // Update the swap request status
        await SwapRequest.updateOne(
            { swapRequestId },
            {
                status: 'accepted',
                acceptedAt: new Date()
            }
        );

        // Mark both items as swapped
        const targetItem = await Item.findOne({ itemId: swapRequest.itemId });
        const offeredItem = await Item.findOne({ itemId: swapRequest.offeredItemId });
        if (targetItem) {
            await Item.updateOne({ itemId: targetItem.itemId }, { status: 'swapped' });
        }
        if (offeredItem) {
            await Item.updateOne({ itemId: offeredItem.itemId }, { status: 'swapped' });
        }

        req.session.success = 'Swap request accepted successfully!';
        res.redirect('/swaps/incoming');
    } catch (err) {
        return next(err);
    }
});

// PUT /swaps/:swapRequestId/reject - Reject a swap request
router.put('/:swapRequestId/reject', async (req, res, next) => {
    try {
        const { swapRequestId } = req.params;

        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        const swapRequest = await SwapRequest.findOne({ swapRequestId });
        if (!swapRequest) {
            return res.status(404).render('error', {
                title: 'Swap Request Not Found',
                message: 'The swap request you are trying to reject does not exist.',
                error: {},
            });
        }

        // Only the receiver can reject the request
        if (swapRequest.receiverId !== req.session.user.userId) {
            return res.status(403).render('error', {
                title: 'Unauthorized',
                message: 'You are not authorized to reject this swap request.',
                error: {},
            });
        }

        // Update the swap request status
        await SwapRequest.updateOne(
            { swapRequestId },
            {
                status: 'rejected',
                rejectedAt: new Date()
            }
        );

        req.session.success = 'Swap request rejected.';
        res.redirect('/swaps/received');
    } catch (err) {
        return next(err);
    }
});

// POST /swaps/:swapRequestId/accept - Accept a swap request (for form compatibility)
router.post('/:swapRequestId/accept', async (req, res, next) => {
    try {
        const { swapRequestId } = req.params;

        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        const swapRequest = await SwapRequest.findOne({ swapRequestId });
        if (!swapRequest) {
            return res.status(404).render('error', {
                title: 'Swap Request Not Found',
                message: 'The swap request you are trying to accept does not exist.',
                error: {},
            });
        }

        // Only the receiver can accept the request
        if (swapRequest.receiverId !== req.session.user.userId) {
            return res.status(403).render('error', {
                title: 'Unauthorized',
                message: 'You are not authorized to accept this swap request.',
                error: {},
            });
        }

        // Update the swap request status
        await SwapRequest.updateOne(
            { swapRequestId },
            {
                status: 'accepted',
                acceptedAt: new Date()
            }
        );

        // Mark both items as swapped
        const targetItem = await Item.findOne({ itemId: swapRequest.itemId });
        const offeredItem = await Item.findOne({ itemId: swapRequest.offeredItemId });
        if (targetItem) {
            await Item.updateOne({ itemId: targetItem.itemId }, { status: 'swapped' });
        }
        if (offeredItem) {
            await Item.updateOne({ itemId: offeredItem.itemId }, { status: 'swapped' });
        }

        req.session.success = 'Swap request accepted successfully!';
        res.redirect('/swaps/received');
    } catch (err) {
        return next(err);
    }
});

// POST /swaps/:swapRequestId/reject - Reject a swap request (for form compatibility)
router.post('/:swapRequestId/reject', async (req, res, next) => {
    try {
        const { swapRequestId } = req.params;

        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        const swapRequest = await SwapRequest.findOne({ swapRequestId });
        if (!swapRequest) {
            return res.status(404).render('error', {
                title: 'Swap Request Not Found',
                message: 'The swap request you are trying to reject does not exist.',
                error: {},
            });
        }

        // Only the receiver can reject the request
        if (swapRequest.receiverId !== req.session.user.userId) {
            return res.status(403).render('error', {
                title: 'Unauthorized',
                message: 'You are not authorized to reject this swap request.',
                error: {},
            });
        }

        // Update the swap request status
        await SwapRequest.updateOne(
            { swapRequestId },
            {
                status: 'rejected',
                rejectedAt: new Date()
            }
        );

        req.session.success = 'Swap request rejected.';
        res.redirect('/swaps/received');
    } catch (err) {
        return next(err);
    }
});

// POST /swaps/:swapRequestId/accept - Accept a swap request (for form compatibility)
router.post('/:swapRequestId/accept', async (req, res, next) => {
    try {
        const { swapRequestId } = req.params;

        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        const swapRequest = await SwapRequest.findOne({ swapRequestId });
        if (!swapRequest) {
            return res.status(404).render('error', {
                title: 'Swap Request Not Found',
                message: 'The swap request you are trying to accept does not exist.',
                error: {},
            });
        }

        // Only the receiver can accept the request
        if (swapRequest.receiverId !== req.session.user.userId) {
            return res.status(403).render('error', {
                title: 'Unauthorized',
                message: 'You are not authorized to accept this swap request.',
                error: {},
            });
        }

        // Update the swap request status
        await SwapRequest.updateOne(
            { swapRequestId },
            {
                status: 'accepted',
                acceptedAt: new Date()
            }
        );

        // Mark both items as swapped
        const targetItem = await Item.findOne({ itemId: swapRequest.itemId });
        const offeredItem = await Item.findOne({ itemId: swapRequest.offeredItemId });
        if (targetItem) {
            await Item.updateOne({ itemId: targetItem.itemId }, { status: 'swapped' });
        }
        if (offeredItem) {
            await Item.updateOne({ itemId: offeredItem.itemId }, { status: 'swapped' });
        }

        req.session.success = 'Swap request accepted successfully!';
        res.redirect('/swaps/received');
    } catch (err) {
        return next(err);
    }
});

// POST /swaps/:swapRequestId/reject - Reject a swap request (for form compatibility)
router.post('/:swapRequestId/reject', async (req, res, next) => {
    try {
        const { swapRequestId } = req.params;

        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        const swapRequest = await SwapRequest.findOne({ swapRequestId });
        if (!swapRequest) {
            return res.status(404).render('error', {
                title: 'Swap Request Not Found',
                message: 'The swap request you are trying to reject does not exist.',
                error: {},
            });
        }

        // Only the receiver can reject the request
        if (swapRequest.receiverId !== req.session.user.userId) {
            return res.status(403).render('error', {
                title: 'Unauthorized',
                message: 'You are not authorized to reject this swap request.',
                error: {},
            });
        }

        // Update the swap request status
        await SwapRequest.updateOne(
            { swapRequestId },
            {
                status: 'rejected',
                rejectedAt: new Date()
            }
        );

        req.session.success = 'Swap request rejected.';
        res.redirect('/swaps/incoming');
    } catch (err) {
        return next(err);
    }
});

// PUT /swaps/:swapRequestId/cancel - Cancel a swap request (by requester)
router.put('/:swapRequestId/cancel', async (req, res, next) => {
    try {
        const { swapRequestId } = req.params;

        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        const swapRequest = await SwapRequest.findOne({ swapRequestId });
        if (!swapRequest) {
            return res.status(404).render('error', {
                title: 'Swap Request Not Found',
                message: 'The swap request you are trying to cancel does not exist.',
                error: {},
            });
        }

        // Only the requester can cancel their own requests
        if (swapRequest.requesterId !== req.session.user.userId) {
            return res.status(403).render('error', {
                title: 'Unauthorized',
                message: 'You can only cancel your own swap requests.',
                error: {},
            });
        }

        // Only pending requests can be cancelled
        if (swapRequest.status !== 'pending') {
            return res.status(400).render('error', {
                title: 'Cannot Cancel',
                message: 'Only pending swap requests can be cancelled.',
                error: {},
            });
        }

        // Update the swap request status
        await SwapRequest.updateOne(
            { swapRequestId },
            {
                status: 'cancelled',
                cancelledAt: new Date()
            }
        );

        req.session.success = 'Swap request cancelled successfully.';
        res.redirect('/swaps/my-requests');
    } catch (err) {
        return next(err);
    }
});

// POST /swaps/:swapRequestId/cancel - Cancel a swap request (by requester) - for form compatibility
router.post('/:swapRequestId/cancel', async (req, res, next) => {
    try {
        const { swapRequestId } = req.params;

        if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
            return res.status(503).render('error', {
                title: 'Service Unavailable',
                message: 'Database connection unavailable. Please try again later.',
                error: {},
            });
        }

        const swapRequest = await SwapRequest.findOne({ swapRequestId });
        if (!swapRequest) {
            return res.status(404).render('error', {
                title: 'Swap Request Not Found',
                message: 'The swap request you are trying to cancel does not exist.',
                error: {},
            });
        }

        // Only the requester can cancel their own requests
        if (swapRequest.requesterId !== req.session.user.userId) {
            return res.status(403).render('error', {
                title: 'Unauthorized',
                message: 'You can only cancel your own swap requests.',
                error: {},
            });
        }

        // Only pending requests can be cancelled
        if (swapRequest.status !== 'pending') {
            return res.status(400).render('error', {
                title: 'Cannot Cancel',
                message: 'Only pending swap requests can be cancelled.',
                error: {},
            });
        }

        // Update the swap request status
        await SwapRequest.updateOne(
            { swapRequestId },
            {
                status: 'cancelled',
                cancelledAt: new Date()
            }
        );

        req.session.success = 'Swap request cancelled successfully.';
        res.redirect('/swaps/my-requests');
    } catch (err) {
        return next(err);
    }
});

module.exports = router;