var db =  require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectID;
const { ObjectId } = require('bson');
const bcrypt = require('bcrypt')
module.exports={
    addProduct:(product,callback)=>{
    
        db.get().collection('product').insertOne(product).then((data)=>{
          
            callback(data.ops[0]._id)
        })
    },
    addImage:(productImages,callback)=>{
        db.get().collection('productImages').insertOne(productImages)


    },

    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
           let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
           resolve(products)
        })

    },
    getOneProduct:(proId)=>{
        return new Promise(async(resolve,reject)=>{
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
            if(product){}
            resolve(product)
        })

    },
    getProductImage:(proId)=>{
        return new Promise(async(resolve, reject)=>{
            let productImage = await db.get().collection(collection.PRODUCT_IMAGE_COLLECTION).findOne({product:objectId(proId)})
            resolve(productImage);
        })

    },

    deleteProducts:(proId)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(proId)}).then((response)=>{
            
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },

    updateProduct:(proId, proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    name:proDetails.name,
                    category:proDetails.category,
                    color:proDetails.color,
                    model:proDetails.model,
                    longDescription:proDetails.longDescription,
                    description:proDetails.description,
                    price:proDetails.price,
                    delivery:proDetails.delivery


                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    doLogin:(adminData)=>{
        return new Promise(async(resolve, reject)=>{
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
            if(admin)
            {
                bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
                    if(status)
                    {
                        console.log("Login success")
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    }else{
                        console.log("Login failed")
                        resolve({status:false})
                    }
                })
            }else{
                console.log('Admin not found')
                    resolve({status:false})
            }
        })
    },
    deleteFiles:(files, callback)=>{
        var i = files.length;
        files.forEach(function(filepath){
          fs.unlink('./public'+ filepath, function(err) {
            i--;
            if (err) {
              callback(err);
              return;
            } else if (i <= 0) {
              callback(null);
            }
          });
        });
      }
}