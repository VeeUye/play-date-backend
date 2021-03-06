'use strict';
 
const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const { db } = require('../db');
const { getUserEvents } = require('./helper');
 
const JSDOtoTimestamp = (d) => {
 return Timestamp.fromDate(new Date(d));
}

const TimestampToJSDO = (d) => {
  return new Date(d*1000);
 }
 
// POST ~/events
exports.create = async (req, res) => {
  try {
    let data = req.body;
    data.date_start = JSDOtoTimestamp(data.date_start);
    data.date_end = JSDOtoTimestamp(data.date_end);
    await db.collection('events').doc().set(data);
    res.status(201).send('Record saved successfully');
  } catch (error) {
    res.status(400).send(error.message);
  }
 };

// GET ~/events
exports.read = async (_, res) => {
  try {
    const snapshot = await db.collection('events').get();
    const eventsArray = snapshot.docs.map((doc) => {
      let event = { id: doc.id, ...doc.data() };
      event.date_start = TimestampToJSDO(event.date_start._seconds);
      event.date_end = TimestampToJSDO(event.date_end._seconds);
      return event;
    });
    res.status(200).send(eventsArray);
  } catch (error) {
    res.status(400).send(error.message);
  }
 };

//  GET ~/events/user-events/{userId}/
exports.readAcceptedUserEvents = (req, res) => {
  getUserEvents(req, res, 'accepted');
};

  //  GET ~/events/user-events/{userId}/pending
exports.readPendingUserEvents = (req, res) => {
  getUserEvents(req, res, 'invited');
 };

 // GET ~/events/user-events/{userId}/declined
 exports.readDeclinedUserEvents = (req, res) => {
  getUserEvents(req, res, 'declined');
 };

// GET ~/events/{eventId}
exports.readById = async (req, res) => {
  try {
    const snapshot = await db.collection('events').doc(req.params.eventId).get();
    let event = { id: snapshot.id, ...snapshot.data() }
    event.date_start = TimestampToJSDO(event.date_start._seconds);
    event.date_end = TimestampToJSDO(event.date_end._seconds);
    res.send(event);
  } catch (error) {
    res.status(400).send(error.message);
  }
 };
 
// PUT ~/events/user-events/accept
exports.acceptInvite = async (req, res) => {
  try {
    const { eventId, userId } = req.body;
    const batch = db.batch();
  
    const eventRef = db.collection('events').doc(eventId);
    batch.update(eventRef, { friends_accepted: FieldValue.arrayUnion(userId)});
    batch.update(eventRef, { friends_invited: FieldValue.arrayRemove(userId)});
    await batch.commit();

    res.status(200).send('Success - invite accepted');
  
  } catch (error) {
    res.status(400).send(error.message);
  }
 }
 
// PUT ~/events/user-events/declined
exports.declineInvite = async (req, res) => {
  try {
    const { eventId, userId } = req.body;
    const batch = db.batch();
    const eventRef = db.collection('events').doc(eventId);
    batch.update(eventRef, { friends_declined: FieldValue.arrayUnion(userId)});
    batch.update(eventRef, { friends_invited: FieldValue.arrayRemove(userId)});
    batch.update(eventRef, { friends_accepted: FieldValue.arrayRemove(userId)});
    await batch.commit();

    res.status(200).send('Success - invite declined');
  
  } catch (error) {
    res.status(400).send(error.message);
  }
 }


// PUT ~/events/{eventId}
exports.updateById = async (req, res) => {
  try {
    await db.collection('events').doc(req.params.eventId).update(req.body);
    res.send('Record updated successfuly');
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// DELETE ~/events/{eventId}
exports.deleteById = async (req, res) => {
  try {
    await db.collection('events').doc(req.params.eventId).delete();
    res.send('Record deleted successfuly');
  } catch (error) {
    res.status(400).send(error.message);
  }
};