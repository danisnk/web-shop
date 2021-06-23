var db =  require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectID;
const { ObjectId } = require('bson');
const { response } = require('express');
module.exports={

    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
             userData.password =await bcrypt.hash(userData.password,10)
             db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
             })
             
        })
        
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve, reject)=>{
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user)
            {
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status)
                    {
                        console.log("Login success")
                        response.user = user
                        response.status = true
                        resolve(response)
                    }else{
                        console.log("Login failed")
                        resolve({status:false})
                    }
                })
            }else{
                console.log('User not found')
                    resolve({status:false})
            }
        })
    },
    addToCart:(proId, userId)=>{
        
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve, reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist = userCart.products.findIndex(product=> product.item==proId)
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                       $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()

                    })
                }else{
                
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:ObjectId(userId)},{
                        $push:{products:proObj}
                }).then((response)=>{
                    resolve()
                })
                }
            }else{
                let cartObj = {
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((respone)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems =  await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',

                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                   $project:{
                       item:1, quantity:1,product:{$arrayElemAt:['$product',0]}
                   } 
                }

            ]).toArray()
            if (cartItems.length == 0)
            {
                resolve("1")
            } 
            else
            {
                resolve(cartItems)
            }
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0
            let cart =  await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count = cart.products.length
            }
            resolve(count)

        })
    },
    changeProductQuantity:(details)=>{
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
                
            } 
            else
            {

                     db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                    {
                       $inc:{'products.$.quantity':details.count}
                    }
                    ).then((response)=>{

                        resolve({status:true})

                    })
                }
                

        })
    },
    removeProduct:(details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }
            ).then((response)=>{
                resolve({removeProduct:true})
            })

        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let  total =  await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',

                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                   $project:{
                       item:1, quantity:1,product:{$arrayElemAt:['$product',0]}
                   } 
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[{ $toInt: '$quantity' },{ $toInt: '$product.price' }]}}
                        
                    }
                }

            ]).toArray()
            try{
                resolve(total[0].total)
            }
            catch {
                resolve(0)
            }
        })

    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            
            let status = order['payment-method']==="COD"?'placed':'placed'
            let orderObj = {
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                date:new Date()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)})
                resolve()
            })

        })


    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products)
        })
    },
    getUserOrders:(userId)=>{
     
        return new Promise(async(resolve, reject)=>{
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({userId:objectId(userId)}).toArray()
              
                resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',

                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                   $project:{
                       item:1, quantity:1,product:{$arrayElemAt:['$product',0]}
                   } 
                }

            ]).toArray()
           
            resolve(orderItems)
        })
    },
    getUserDetails:(userId)=>{
        return new Promise(async(resolve, reject)=>{
           let user = await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
            resolve(user)
            
        })

    },
    updateUser:(userId, userDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
            {
                $set:{
                    Name:userDetails.Name,
                    Email:userDetails.Email,
                    Mobile:userDetails.Mobile,
                    Bio:userDetails.Bio
                }
            }).then((response)=>{
                resolve()
            })
        })

    }
}