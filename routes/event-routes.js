const express = require("express")
const router = express.Router()
const Event = require('../models/Evnet')
const Book = require('../models/BookImage')
const multer = require("multer")

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/images')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + '.png') 
    }
  })
  
  var upload = multer({ storage: storage })


// validate input
const { check, validationResult } = require('express-validator/check')
// date and time
const moment = require('moment');
moment().format();

// middleware to check if user is loogged in

isAuthenticated = (req,res,next) => {
    if (req.isAuthenticated()) return next()
    res.redirect('/users/login')
}


//bookImage

router.post('/uploadBookImage', upload.single('bookAvatar'), (req,res)=> {
    console.log('Route reached');
    let newFields = {
        bookAvatar: req.file.filename
    }
    Book.updateOne( {_id: req.user._id}, newFields, (err)=> {
        if (!err) {
            res.redirect('/events/create')
            // res.redirect('/events')

        }else {
            // Handle error
            console.error(err);
            console.error('fuck');

            res.status(500).send('Internal Server Error');
        }

    } )
})


//create new events

router.get('/create',isAuthenticated, (req,res)=> {
   
    res.render('event/create', {
        errors: req.flash('errors')
    })
})
// route to home events
router.get('/:pageNo?', (req,res)=> {   
    let pageNo = 1

    if ( req.params.pageNo) {
        pageNo = parseInt(req.params.pageNo)
    }
    if (req.params.pageNo == 0)   {
        pageNo = 1
    }
    
    let q = {
        skip: 6 * (pageNo - 1),
        limit: 6
    }
    //find totoal documents
    let totalDocs = 0 

    Event.countDocuments({}, (err,total)=> {

    }).then( (response)=> {
        totalDocs = parseInt(response)
        Event.find({},{},q, (err,events)=> {
            //     res.json(events)
                 let chunk = []
                 let chunkSize = 3
                 for (let i =0 ; i < events.length ; i+=chunkSize) {
                     chunk.push(events.slice( i, chunkSize + i))
                 }
                 //res.json(chunk)
                  res.render('event/index', {
                      chunk : chunk,
                      message: req.flash('info'),
                      total: parseInt(totalDocs),
                      pageNo: pageNo
                  })
             })
    })

  
})


// save event to db

router.post('/create', upload.single('avatar'),[
    check('title').isLength({min: 5}).withMessage('Title should be more than 5 char'),
    check('description').isLength({min: 5}).withMessage('Description should be more than 5 char'),
    check('location').isLength({min: 3}).withMessage('Shelf# should be more than 5 char'),
    check('date').isLength({min: 5}).withMessage('Date should valid Date'),

] , (req,res)=> {

    const errors = validationResult(req)
  
    if( !errors.isEmpty()) {
        
        req.flash('errors',errors.array())
        res.redirect('/events/create')
    } else {
        
        let newEvent = new Event({
            title: req.body.title,
            description: req.body.description,
            date: req.body.date,
            location: req.body.location,
            avatar: req.file ? req.file.filename : null,
            user_id:  req.user.id,
            created_at: Date.now()
        })

        // newEvent.save( (err)=> {
        //     if(!err) {
        //         console.log('Book was added')
        //         req.flash('info', ' The Book was created successfuly')
        //         res.redirect('/events')
        //     } else {
        //         console.log(err)
        //     }
        // })
        newEvent.save((err) => {
            if (!err) {
                console.log('Event was added');
                req.flash('info', 'The Event was created successfully');
                res.redirect('/events');
            } else {
                console.error(err);
                req.flash('errors', 'An error occurred while saving the event.');
                res.redirect('/events/create');
            }
        });
    }
   
})
// req.body properties come from a  form post where the form data (which is submitted in the body contents) has been parsed into properties of the body tag. 
// req.params comes from path segments of the URL that match a parameter in the route definition such a /song/:songid. 
// req.query comes from query parameters in the URL such as http://foo.com/somePath?name=ted where req.query.name === "ted"
// show single event
router.get('/show/:id', (req,res)=> {
    Event.findOne({_id: req.params.id}, (err,event)=> {
        
       if(!err) {
           
        res.render('event/show', {
            event: event
        })

       } else {
           console.log(err)
       }
    
    })
 
})

// edit route

router.get('/edit/:id', isAuthenticated,(req,res)=> {

    Event.findOne({_id: req.params.id}, (err,event)=> {
        
        if(!err) {
       
         res.render('event/edit', {
             event: event,
             eventDate: moment(event.date).format('YYYY-MM-DD'),
             errors: req.flash('errors'),
             message: req.flash('info')
         })
 
        } else {
            console.log(err)
        }
     
     })

})



// router.post('/update', upload.single('avatar'), isAuthenticated, async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             req.flash('errors', errors.array());
//             return res.redirect('/events/edit/' + req.body.id);
//         }

//         let newFields = {
//             title: req.body.title,
//             description: req.body.description,
//             location: req.body.location,
//             date: req.body.date,
//             avatar: req.file ? req.file.filename : null,
//         };

//         let query = { _id: req.body.id };

//         // Use findByIdAndUpdate for updating a document by its ID
//         await Event.findByIdAndUpdate(query, newFields);

//         console.log('Story was updated successfully');
//         req.flash('info', 'The Story was updated successfully');
//         res.redirect('/events');
//     } catch (err) {
//         console.error(err);
//         req.flash('errors', 'An error occurred while updating the Story.');
//         res.redirect('/events/edit/' + req.body.id);
//     }
// });
router.post('/update',[
    check('title').isLength({min: 5}).withMessage('Title should be more than 5 char'),
    check('description').isLength({min: 5}).withMessage('Description should be more than 5 char'),
    check('location').isLength({min: 3}).withMessage('Shelf# should be more than 5 char'),
    check('date').isLength({min: 5}).withMessage('Date should valid Date'),

], isAuthenticated,(req,res)=> {
    
    const errors = validationResult(req)
    if( !errors.isEmpty()) {
       
        req.flash('errors',errors.array())
        res.redirect('/events/edit/' + req.body.id)
    } else {
       // crete obj
       let newfeilds = {
           title: req.body.title,
           description: req.body.description,
           location: req.body.location,
           date: req.body.date
       }
       let query = {_id: req.body.id}

       Event.updateOne(query, newfeilds, (err)=> {
           if(!err) {
               req.flash('info', " The story was updated successfuly"),
            //    res.redirect('/events/edit/' + req.body.id)
               res.redirect('/events')

           } else {
               console.log(err)
           }
       })
    }
   
})



//delete event

router.delete('/delete/:id',isAuthenticated, (req,res)=> {

    let query = {_id: req.params.id}

    Event.deleteOne(query, (err)=> {

        if(!err) {
            res.status(200).json('deleted')
        } else {
            res.status(404).json('There was an error .Book was not deleted')
        }
    })
})

module.exports = router 