const express = require('express');
const app = express();
const multer= require('multer');
app.use(express.json());

const {Storage} = require("@google-cloud/storage");
const  {StorageControlClient} = require("@google-cloud/storage-control").v2
const controlClient = new StorageControlClient()
const bucket=new Storage()
const port = process.env.PORT || 4000;
const bucketName = process.env.BUCKET||"ingreedio-bucket";
const requestStorage = multer.memoryStorage()
const upload = multer({storage:requestStorage})
const base_url="https://storage.googleapis.com"


app.listen(port, () => {console.log(`Listening on port ${port}`)})

app.get("/get_images/:id", async (req, res) => {
    const id = req.params.id;
    const res_dic={}

    const [files]= await bucket.bucket(bucketName).getFiles({prefix:`${id}/`})
    for (const file of files){
        var type=file.name.split("/")[1].split(".")[0]
        res_dic[type+"Url"]=base_url+"/"+bucketName+"/"+file.name
    }
    return res.status(200).send(res_dic)
})

const extensionMapper=(file)=>{
 return "."+file.originalname.split(".")[1]
}
const typeMapper=(file)=>{
    return file.fieldname
}
app.post("/post_images",upload.any(),async (req, res) => {
    const id=req.body.id;
    const files=req.files;
    const url=`${base_url}/${bucketName}/${id}/`
    const res_dict={}
    for (let i=0; i<files.length;i++){
        var file=typeMapper(files[i])+extensionMapper(files[i]);
        const blob=  bucket.bucket(bucketName).file(id+"/"+file)

        const blobStream=blob.createWriteStream({
            meatadata:{
                contentType:"image/png",
            }
        })


        const buffer=Buffer.from(req.files[i].buffer)
        blobStream.on('error', err => {
            throw err;
        });

        blobStream.on('finish', () => {
            console.log(`File uploaded to ${blob.name}`);
        });
        await blobStream.end(buffer);
        res_dict[typeMapper(files[i])+"Url"]=url+file
    }
    return res.status(200).send(res_dict);
})


app.delete("/delete_images/:id", async (req, res) => {
    const id=req.params.id;
    const [files]= await bucket.bucket(bucketName).getFiles({prefix:`${id}/`})
    if (files.length==0){
        return res.status(403).send({"message":"No file found."})
    }
    for (const file of files){
       await bucket.bucket(bucketName).file(file.name).delete()
    }
    return res.status(200).send({"message":"images deleted successfully."});
})

