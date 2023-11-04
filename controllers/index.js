const { ObjectId } = require('mongodb');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const mongodb = require('../db/connect');
const validate = require('./validateValues');

const getCurrentDate = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

const getOpinions = async (req, res, next) => {
    const token = process.env.OWNER_TOKEN;

    let ownerInfo = await mongodb.getDb().db().collection('owner_info').findOne({ token: token });

    const searchType = ownerInfo.searchMode;
    const displayAllOpinions = ownerInfo.displayAllOpinions;

    let result = [];
    let query = {};

    if (!displayAllOpinions) {
        query.display = true;
    }

    switch(searchType){
        case 'priority' :
            result = await mongodb.getDb()
                .db()
                .collection('opinions')
                .find(query)
                .sort({ priority: -1, priorityPosition: 1 })
                .toArray();
            break;
        case 'byDate':
            result = await mongodb.getDb()
                .db()
                .collection('opinions')
                .find(query)
                .sort({ created_at: -1})
                .toArray();
            break;
        default:
            result = await mongodb.getDb().db().collection('opinions').find(query).toArray();
            break;
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
}

const getOwnerInfo = async (req, res, next) => {
    const token = req.params.token;
    if(token != process.env.OWNER_TOKEN){
        res.status(404).send('INVALID TOKEN');
        return;
    }

    const result = await mongodb.getDb()
        .db()
        .collection('owner_info')
        .findOne({ token: token }, { projection: { name: 1, searchMode: 1, displayAllOpinions: 1, usePriority: 1 } });
    if (result) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(result);
    } else {
        res.status(404).send('EMPTY RESULT');
        return;
    }
};

const getAllProducts = async (req, res, next) => {
    const result = await await mongodb.getDb().db().collection('products').find().toArray();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
};

const getAllProductsSold = async (req, res, next) => {
    const result = await await mongodb.getDb().db().collection('productsSold').find().toArray();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
};

const getOpinionsById = async (req, res, next) => {
    const id = req.params.id;
    const objectId = new ObjectId(id);
    const result = await mongodb.getDb().db().collection('opinions').findOne({ _id: objectId });
    if (result) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(result);
    } else {
        res.status(404).send('Contact not found');
    }
};

const getProductById = async (req, res, next) => {
    const id = req.params.id;
    const objectId = new ObjectId(id);
    const result = await mongodb.getDb().db().collection('products').findOne({ _id: objectId });
    if (result) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(result);
    } else {
        res.status(404).send('Contact not found');
    }
};

const getProductSoldById = async (req, res, next) => {
    const id = req.params.id;
    const objectId = new ObjectId(id);
    const result = await mongodb.getDb().db().collection('productsSold').findOne({ _id: objectId });
    if (result) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(result);
    } else {
        res.status(404).send('Contact not found');
    }
};

const putNewOpinion = async (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Request body is empty" });
    }
    const newOpinion = req.body;
    const productSoldId = newOpinion.productSoldId;
    const objectId = new ObjectId(productSoldId);
    if (!productSoldId) {
        return res.status(400).json({ error: "Token is missing in the request body" });
    } else if(newOpinion.rating == null){
        return res.status(400).json({ error: "Please choose your rating." });
    }

    const productSold = await mongodb.getDb().db().collection('productsSold').findOne({ _id: objectId });

    if (!productSold) {
        return res.status(404).json({ error: "Product not found" });
    }

    if (productSold.hasOpinion === false) {
        newOpinion.created_at = getCurrentDate();
        newOpinion.updated_at = newOpinion.created_at;
        newOpinion.edited = false;
        newOpinion.priority = false;
        newOpinion.display = false;
        newOpinion.priorityPosition = 0;

        const result = await mongodb.getDb().db().collection('opinions').insertOne(newOpinion);
        await mongodb.getDb().db().collection('productsSold').updateOne({ _id: objectId }, { $set: { hasOpinion: true } });
        return res.status(201).json({ id: result.insertedId });
    } else {
        newOpinion.updated_at = getCurrentDate();
        newOpinion.edited = true;

        const result = await mongodb.getDb().db().collection('opinions').updateOne({ productSoldId: productSoldId }, { $set: { message: newOpinion.message, edited: newOpinion.edited, updated_at: newOpinion.updated_at, rating:  newOpinion.rating} });
        console.log(result);
        if(result.modifiedCount == 0){
            return res.status(200).json({success: false, message: "Opinion was not updated" });
        }
        return res.status(200).json({success: true, message: "Opinion updated successfully" });
    }
};

const putNewProduct = async (req, res, next) => {
    const newProduct = req.body;
    newProduct.name = newProduct.name.toUpperCase();
    const token = newProduct.token;
    if (!token) {
        return res.status(400).json({ error: "Token is missing in the request body" });
    }
    
    if (token != process.env.OWNER_TOKEN) {
        return res.status(400).json({ error: "Token is invalid" });
    }

    delete newProduct.token;

    if(!validate.validateProductInfo(newProduct)){
        return res.status(400).json({ error: "The product is invalid." });
    }
    
    const existingProduct = await mongodb.getDb().db().collection('products').findOne({ name: newProduct.name });
    
    if (existingProduct) {
        return res.status(400).json({ error: `The product ${newProduct.name} already exists.`});
    }
    
    const result = await mongodb.getDb().db().collection('products').insertOne(newProduct);
    return res.status(201).json({ id: result.insertedId });
};

const putNewProductSold = async (req, res, next) => {
    const newProductSold = req.body;
    newProductSold.hasOpinion = false;
    const token = newProductSold.token;
    if (!token) {
        return res.status(400).json({ error: "Token is missing in the request body" });
    }
    
    if (token != process.env.OWNER_TOKEN) {
        return res.status(400).json({ error: "Token is invalid" });
    }

    delete newProductSold.token;

    if(!validate.validateProductSoldInfo(newProductSold)){
        return res.status(400).json({ error: "The information is invalid." });
    }
    
    const result = await mongodb.getDb().db().collection('productsSold').insertOne(newProductSold);
    return res.status(201).json({ id: result.insertedId });
};

const deleteOpinion = async (req, res, next) => {
    const opinion = req.body;
    const objectId = new ObjectId(opinion.opinionId);
    const result = await mongodb.getDb().db().collection('opinions').deleteOne({ _id: objectId });
    
    if(result.deletedCount > 0){
        return res.status(201).json({'success': true});
    }
    
    return res.status(201).json({'success': false});
};

const deleteProduct = async (req, res, next) => {
    const product = req.body;
    const objectId = new ObjectId(product.productId);
    const result = await mongodb.getDb().db().collection('products').deleteOne({ _id: objectId });

    if(result.deletedCount > 0){
        return res.status(201).json({'success': true});
    }
    
    return res.status(201).json({'success': false});
};

const deleteProductSold = async (req, res, next) => {
    const productSold = req.body;
    const objectId = new ObjectId(productSold.productSoldId);
    const result = await mongodb.getDb().db().collection('productsSold').deleteOne({ _id: objectId });
    
    if(result.deletedCount > 0){
        return res.status(201).json({'success': true});
    }
    
    return res.status(201).json({'success': false});
};

module.exports = { getOpinions, getOwnerInfo, getAllProducts, getAllProductsSold, getOpinionsById, getProductById, getProductSoldById, putNewOpinion, putNewProduct, putNewProductSold, deleteOpinion, deleteProduct, deleteProductSold};