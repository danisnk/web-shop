var express = require('express');
const { rawListeners } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  }
  else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function (req, res, next) {
  let cartCount = null
  let user = req.session.user
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount });
  })

});
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.userLoginErr })
    req.session.userLoginErr = false
  }

})
router.get('/signup', (req, res) => {
  res.render('user/signup')


})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);

    req.session.user = response
    req.session.userLoggedIn = true
    res.redirect('/')

  })

})
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {

      req.session.user = response.user
      req.session.userLoggedIn = true
      res.redirect('/')
    } else {
      req.session.userLoginErr = "Invalid username or password"
      res.redirect('/login')
    }
  })

})
router.get('/logout', verifyLogin, (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user

  let products = await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  console.log("This is total"+totalValue)
  res.render('user/cart', { products, user, totalValue })
})
router.get('/myprofile', verifyLogin, async (req, res) => {
  let userId = req.session.user._id
  let user = req.session.user
  let userDetails = await userHelpers.getUserDetails(req.session.user._id)

  res.render('user/myprofile', { userDetails, userId, user })
})

router.get('/edit-profile', verifyLogin, async (req, res) => {
  let userId = req.session.user._id
  let user = req.session.user
  let userDetails = await userHelpers.getUserDetails(req.session.user._id)
  res.render('user/edit-profile', { userDetails, userId, user })
})

router.post('/edit-profile/:id', verifyLogin, (req, res) => {
  let id = req.params.id
  
  userHelpers.updateUser(req.params.id, req.body).then(() => {
    res.redirect('/myprofile')
    if (req.files.image) {
      console.log("blaaa")
      let image = req.files.image
      console.log(id)
      image.mv('./public/profile-images/' + id + '.jpg', (err) => {
        if (!err) {
          res.render("/myprofile")
        } else {
          console.log(err)
        }
      })
    }
  })



})

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    // res.redirect('/')
    res.json({ status: true })
  })
})

router.get('/product-page/:id', verifyLogin, async (req, res) => {
  let product = await productHelpers.getOneProduct(req.params.id)
  let productImage = await productHelpers.getProductImage(req.params.id)
  let productImageUrls = productImage['productImageUrls']
  let user = req.session.user
 
  res.render('user/product-page', { product,productImageUrls, user })
})

router.post('/change-product-quantity/', verifyLogin, (req, res) => {

  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)

  })
})
router.post('/remove-product', verifyLogin, (req, res) => {
  userHelpers.removeProduct(req.body).then((response) => {
    res.json(response)
  })
})
router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order', { total, user: req.session.user })
})

router.post('/place-order', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
    if (req.body['payment-method' === "COD"]) {
      res.json({ status: true })
    } else {
      res.json({ status: false })
    }
  })
  console.log(req.body)
})
router.get('/online-details', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/online-details', { user: req.session.user, total })
})
router.get('/order-success', verifyLogin, (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})
router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { user: req.session.user, orders })
})
router.get('/view-order-products/:id', verifyLogin, async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { user: req.session.user, products })
})
module.exports = router;

