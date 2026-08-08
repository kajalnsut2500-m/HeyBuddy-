const Person = require('../models/Person')
const UserDto = require('../dtos/user-dto')
const {hash, compare} = require('bcrypt')

class UserController {
    async registration(req, res, next) {
        try {
            const {nickname, email, password, repeat_password} = req.body
            if (password !== repeat_password)
                return res.status(400).send({message: 'Passwords don\'t match'})

            const hashPassword = await hash(password, 4)

            Person.create({
                nickname,
                email,
                password: hashPassword
            }).then(person => {
                req.session.user = new UserDto(person)
                res.send(person)
            }).catch(e => {
                const error = e.parent.constraint ? e.parent.constraint : e.name
                res.status(400).send({
                    'message': error
                })
            })
        } catch (e) {
            next(e)
        }
    }

    async login(req, res, next) {
        try {
            const {email, password} = req.body
            const person = await Person.findOne({where: {email: email}})

            if (!person)
                return res.status(400).send({message: 'User with this email doesn\'t exists'})

            const isPassEquals = await compare(password, person.password)
            if (!isPassEquals)
                return res.status(400).send({message: 'Incorrect email or password'})

            req.session.user = new UserDto(person)
            res.send(person)
        } catch (e) {
            next(e)
        }
    }

    async updateUser(req, res, next) {
        try {
            const {id, nickname} = req.body
            Person.update({nickname: nickname}, {where: {id: id}}).then(async _ => {
                const person = await Person.findOne({where: {id: id}})
                req.session.user = new UserDto(person)
                res.send({message: 'Successfully updated', 'user': person})
            }).catch(e => {
                console.log(e.name)
                res.status(400).send({message: e.name})
            })
        } catch (e) {
            next(e)
        }
    }

    async uploadImage(req, res, next) {
        try {
            const ID = req.session.user.id
            Person.update({image: req.file.path}, {where: {id: ID}}).then(async _ => {
                const person = await Person.findOne({where: {id: ID}})
                req.session.user = new UserDto(person)

                res.send({message: 'Successfully updated', 'user': person})
            }).catch(e => {
                res.send({message: e.name})
            })
        } catch (e) {
            next(e)
        }
    }

    getUser(req, res) {
        if (!req.session.user) return res.status(404).send({message: 'You must be logged in'})
        res.send(req.session.user)
    }

    getUserById(req, res) {
        Person.findOne({
            attributes:
                {exclude: ['email', 'password', 'createdAt', 'updatedAt']},
            where:
                {id: req.params.id}
        }).then(person => {
            res.send(person)
        }).catch(e => {
            res.status(400).send(e)
        })
    }

    logout(req, res) {
        req.session.destroy()
        res.send({message: 'Logout'})
    }
}

module.exports = new UserController()