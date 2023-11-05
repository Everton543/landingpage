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
        .findOne({ token: token }, { projection: { name: 1, searchMode: 1, displayAllOpinions: 1} });
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
        res.status(404).send('Opinion not found');
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
        res.status(404).send('Product not found');
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
        res.status(404).send('Product sold not found');
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
        if(result.modifiedCount == 0){
            return res.status(200).json({success: false, message: "Opinion was not updated" });
        }
        return res.status(200).json({success: true, message: "Opinion updated successfully" });
    }
};

const putNewProduct = async (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Request body is empty" });
    }
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

    const productId = new ObjectId(productSold.productId);
    const product = await mongodb.getDb().db().collection('products').findOne({ _id: productId });
    if (product == null) {
        return res.status(400).json({success: false, error: "Product does not exists" });
    }
    
    const result = await mongodb.getDb().db().collection('productsSold').insertOne(newProductSold);
    return res.status(201).json({ id: result.insertedId });
};

const deleteOpinion = async (req, res, next) => {
    const opinion = req.body;
    const objectId = new ObjectId(opinion.opinionId);

    const opinionDeleted = await mongodb.getDb().db().collection('opinions').findOne({ _id: objectId });
    if(!opinionDeleted || !opinionDeleted.productSoldId) {
        return res.status(400).json({success: false, error: "The opinion does not exist" });
    }

    const productSoldId = new ObjectId(opinionDeleted.productSoldId);
    mongodb.getDb().db().collection('productsSold').updateOne({ _id: productSoldId }, { $set: { hasOpinion: false } });

    const result = await mongodb.getDb().db().collection('opinions').deleteOne({ _id: objectId });
    if(result.deletedCount > 0){
        return res.status(201).json({success: true, message: "Opinion deleted successfully"});
    }
    
    return res.status(400).json({success: false, error: "The opinion does not exist" });
};

const deleteProduct = async (req, res, next) => {
    const product = req.body;
    const objectId = new ObjectId(product.productId);
    const result = await mongodb.getDb().db().collection('products').deleteOne({ _id: objectId });

    if(result.deletedCount > 0){
        return res.status(201).json({success: true, message: "Product deleted successfully"});
    }
    
    return res.status(400).json({success: false, error: "The product does not exist"});
};

const deleteProductSold = async (req, res, next) => {
    const productSold = req.body;
    const objectId = new ObjectId(productSold.productSoldId);
    mongodb.getDb().db().collection('opinions').deleteOne({ productSoldId: productSold.productSoldId });
    const result = await mongodb.getDb().db().collection('productsSold').deleteOne({ _id: objectId });
    
    if(result.deletedCount > 0){
        return res.status(201).json({success: true, message: "Product sold deleted successfully"});
    }
    
    return res.status(400).json({success: false, error: "The product sold does not exist"});
};

const updateProduct = async (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({success: false, error: "Request body is empty" });
    }
    const product = req.body;
    if(!validate.validateProductInfo(product)){
        return res.status(400).json({success: false, error: "The product is invalid." });
    }
    product.name = product.name.toUpperCase();
    const token = product.token;
    if (!token) {
        return res.status(400).json({success: false, error: "Token is missing in the request body" });
    }
    
    if (token != process.env.OWNER_TOKEN) {
        return res.status(400).json({success: false, error: "Token is invalid" });
    }

    if(!product || !product.productId) {
        return res.status(400).json({success: false, error: "There is no productId" });
    }

    delete product.token;
    const objectId = new ObjectId(product.productId);

    const result = await mongodb.getDb().db().collection('products').updateOne({ _id: objectId }, { $set: { name: product.name, detail: product.detail} });
    if(result.modifiedCount == 0){
        return res.status(400).json({success: false, error: "Product was not updated" });
    }

    return res.status(200).json({success: true, message: "Product updated successfully" });
}

const updateProductSold = async (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({success: false, error: "Request body is empty" });
    }
    const productSold = req.body;
    if(!validate.validateProductSoldInfo(productSold)){
        return res.status(400).json({success: false, error: "The product sold is invalid." });
    }
    productSold.name = productSold.name.toUpperCase();
    const token = productSold.token;
    if (!token) {
        return res.status(400).json({success: false, error: "Token is missing in the request body" });
    }
    
    if (token != process.env.OWNER_TOKEN) {
        return res.status(400).json({success: false, error: "Token is invalid" });
    }

    if(!productSold || !productSold.productSoldId) {
        return res.status(400).json({success: false, error: "There is no productSoldId" });
    }

    delete productSold.token;
    const productId = new ObjectId(productSold.productId);
    const product = await mongodb.getDb().db().collection('products').findOne({ _id: productId });
    if (product == null) {
        return res.status(400).json({success: false, error: "Product does not exists" });
    }
    const objectId = new ObjectId(productSold.productSoldId);

    const result = await mongodb.getDb().db().collection('productsSold').updateOne({ _id: objectId }, { $set: {
            productId: productSold.productId,
            dateSold: productSold.dateSold,
            hasOpinion: productSold.hasOpinion,
            name: productSold.name, 
        } 
    });
    if(result.modifiedCount == 0){
        return res.status(400).json({success: false, error: "Product sold was not updated" });
    }

    return res.status(200).json({success: true, message: "Product sold updated successfully" });
}

const updateOwnerInfo = async (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({success: false, error: "Request body is empty" });
    }
    const owner_info = req.body;
    if(!validate.validateOwnerInfo(owner_info)){
        return res.status(400).json({success: false, error: "The invalid information." });
    }
    const token = owner_info.token;
    if (!token) {
        return res.status(400).json({success: false, error: "Token is missing in the request body" });
    }
    
    if (token != process.env.OWNER_TOKEN) {
        return res.status(400).json({success: false, error: "Token is invalid" });
    }

    const result = await mongodb.getDb().db().collection('owner_info').updateOne({ token: token }, { $set: 
        {
             name: owner_info.name,
             searchMode: owner_info.searchMode,
             displayAllOpinions: owner_info.displayAllOpinions,
        }
     });
    if(result.modifiedCount == 0){
        return res.status(400).json({success: false, error: "Information was not updated" });
    }

    return res.status(200).json({success: true, message: "Information updated successfully" });
}

module.exports = { getOpinions, getOwnerInfo, getAllProducts, getAllProductsSold, getOpinionsById, getProductById, getProductSoldById, putNewOpinion, putNewProduct, putNewProductSold, deleteOpinion, deleteProduct, deleteProductSold, updateProduct, updateProductSold, updateOwnerInfo};