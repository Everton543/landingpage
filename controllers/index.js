const { ObjectId } = require('mongodb');
const path = require('path');

const getPersonName = (req, res, next) => {
    res.json('Evany Campos');
};

const mongodb = require('../db/connect');
const getContacts = async (req, res, next) => {
    const result = await mongodb.getDb().db().collection('contacts').find();
    result.toArray().then((lists) => {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(lists);
    });
};

const getContactById = async (req, res, next) => {
    const id = req.params.id;
    const objectId = new ObjectId(id);
    const result = await mongodb.getDb().db().collection('contacts').findOne({ _id: objectId });
    if (result) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(result);
    } else {
        res.status(404).send('Contact not found');
    }
};

const saveContact = async (req, res, next) => {
    const newContact = {
        "firstName": "New Contact Name",
        "lastName": "New Contact last name",
        "email": "thisisfake@gmail.com",
        "favoriteColor": "Blue",
        "birthday": "16/10/90"
    };
    const result = await mongodb.getDb().db().collection('contacts').insertOne(newContact);
    res.status(201).json({ id: result.insertedId });
};

const updateContact = async (req, res, next) => {
        const id = req.params.id;
        const objectId = new ObjectId(id);
        const updatedContact = {
            "firstName": "Update Contact Name",
            "lastName": "Update Contact last name",
            "email": "updatethisisfake@gmail.com",
            "favoriteColor": "Dark Blue",
            "birthday": "16/10/93"
        };
        await mongodb.getDb().db().collection('contacts').updateOne({ _id: objectId }, { $set: updatedContact });
        res.status(204).send();
};

const deleteContact = async (req, res, next) => {
    const id = req.params.id;
    const objectId = new ObjectId(id);
    await mongodb.getDb().db().collection('contacts').deleteOne({ _id: objectId });
    res.status(200).send();
};


module.exports = { getPersonName, getContacts, getContactById, saveContact, updateContact, deleteContact};