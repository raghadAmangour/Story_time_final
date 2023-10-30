const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')

const bookSchema = new mongoose.Schema({
   
    bookAvatar: {
        type: String,
        required: true
    }
    
   
})

bookSchema.methods.hashPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10))
}

bookSchema.methods.comparePasswords = (password, hash) => {
    return bcrypt.compareSync(password,hash)
}

let Book = mongoose.model('Book', bookSchema, 'books')

module.exports = Book