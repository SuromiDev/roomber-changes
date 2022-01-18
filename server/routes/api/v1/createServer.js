const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');
const auth = require('../../../auth');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/createServer', (req, res) => {
        if (!matchCharacterLimit("server", req.body.name)) {
            res.send({ error: `The server name you provided is over the character limit of ${characterLimits['server'][1]} characters` });
            return;
        }
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.Server.countDocuments({ name: req.body.name }, (err, count) => {
                if (count > 0) {
                    res.sendStatus(409);
                } else {
                    var server = new req.db.Server({
                        name: req.body.name,
                        channels: [],
                        owner: req.body.user,
                        users: [req.body.user]
                    });
                    if (req.body["picture"]) {
                        server.picture = req.body.picture;
                    }
                    server.save(err => {
                        if (!err) res.send(server);
                    })
                    req.db.User.find({ _id: req.body.user }, (err, usr) => {
                        var user = usr[0];
                        user.servers.push(server._id);
                        user.save();
                    })
                }
            })
        })
    })