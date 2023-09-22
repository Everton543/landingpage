const { ObjectId } = require('mongodb');

const getPersonName = (req, res, next) => {
    res.json('Evany Campos');
}

const mongodb = require('../db/connect');
const getContacts = async (req, res, next) => {
    const result = await mongodb.getDb().db().collection('contacts').find();
    result.toArray().then((lists) => {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(lists);
    });
}
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

module.exports = { getPersonName, getContacts, getContactById };