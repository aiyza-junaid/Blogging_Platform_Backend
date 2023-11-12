require('dotenv').config();

const express = require('express'); 
const User = require('./Models/Users');
const Blog = require('./Models/Blogs');
const Comment = require('./Models/Comments');
const Rating = require('./Models/Ratings');
const Notification = require('./Models/Notifications');
const router=express.Router()

router.use(express.json()); 
router.use(express.urlencoded({ extended: true }));
const jwt = require('jsonwebtoken');

router.use(express.json());


//register user
router.post('/register', async (req, res) => {
    const {name,username,email,password}=req.body;

    if(!(name && username && email && password))
    {
      res.status(409).json({ error: "All fields not filled" });
      return;
    }
    try {
    const oldUser= await User.findOne({username});
    if(oldUser)
    {
      res.status(409).json({ error: "User Exists! Please login" });
      return;
    }
    const user = new User({ name, email, username, password });
    await user.save();
    res.status(200).json({ message: "Registered" });
    }
    catch(error){
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

//login and authorization
router.post('/login', async (req, res) =>{

    try {

        const { name, id, username, email,  password } = req.body;
  
        const user = await User.findOne({ username });
  
        
            if (user) {
                if(user.isDisabled == false){
                    const payload = {
                    
                        username: user.username,
                        name: user.name, 
                        _id: user._id
                    };
                   
    
                    const accesst = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
                    res.status(200).json({message: "Logged in!" , accesst: accesst});
        
                    

                }
                else{
                    return res.status(200).json({message: "User is Disabled. Cannot login"});
                }
                
            } else {
                return res.status(400).json({ error: "Invalid Credentials" });
            }

        
       
    } catch (err) {

        return res.status(500).json({ error: "Server Error" });
    }
});


function authentication(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null){
            return res.sendStatus(403);
    }
    if (!token) {
        return res.sendStatus(403);
    }
    else{
        console.log('Auth Header:', authHeader);

jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
        console.log('JWT Verification Error:', err);
        return res.sendStatus(403);
    } else {

        
        
        req.user = user;
        const userDetails = await User.findOne({ username: user.username });

        if (userDetails) {
            req.user.name = userDetails.name;
            req.user._id = userDetails._id;
            req.user.role = userDetails.role;

        }

        
        console.log('Decoded User:', req.user);
        console.log(token);
        next();
    }
});
}
}


//create new blog post
router.post('/create_post', authentication, async (req, res) => {
    const { title, blogContent, categories } = req.body;


    try {
        const newBlogPost = new Blog({
            title,
            blogContent,
            author: req.user.name,
            user_id: req.user._id, 
            categories: categories
            
        });

        await newBlogPost.save();
        res.status(201).json(newBlogPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//read post by id 
router.get('/posts/:postId', authentication, async (req, res) => {
    try {
      const postId = req.params.postId;
      const post = await Blog.findById(postId);

      if(post.isDisabled === false){

        if (!post) {
            return res.status(404).json({ message: 'Blog post not found' });
          }
      
          res.json(post);

      }
  
      else{
        res.json({messgae: 'Blog is Disabled. Cannot Show'});
      }
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
});


//get all the posts 
router.get('/posts', async (req, res) => {
    try {
        const { page, limit, author, keyword, sort, category } = req.query;
        const skip = (page - 1) * limit;
    
        const query = {isDisabled: false};
        if (author) {
          query.author = author;
        }
        if (keyword) {
          query.$or = [
            { title: { $regex: keyword, $options: 'i' } },
            { blogContent: { $regex: keyword, $options: 'i' } },
            
          ];
        }

        if (category) {
            query.categories = category;
        }
    
        
        const blogPosts = await Blog.find(query).sort(sort)
          .skip(skip)
          .limit(parseInt(limit));
         
        res.json(blogPosts);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
});

//update by id 
router.put('/update_posts/:postId', authentication,  async (req, res) =>{
  const postId = req.params.postId;
  const updatedPost = req.body;
  const user_id = req.user._id.toString();


  try {
    const result = await Blog.findByIdAndUpdate(
      postId,
      {
        $set: {
          title: updatedPost.title,
          blogContent: updatedPost.blogContent,
        },
      },
      { new: true }
    );


    if (!result) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    if (result.user_id.toString() !== user_id) {
      return res.status(403).json({ message: 'Forbidden: You are not the owner of this blog post' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

//delete by id
router.delete('/delete_posts/:postId', authentication,  async (req, res) =>{
    const postId = req.params.postId;
    
    const user_id = req.user._id.toString();
  
  
    try {
      const result = await Blog.findByIdAndRemove(postId);
  
      if (!result) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
  
      if (result.user_id.toString() !== user_id) {
        return res.status(403).json({ message: 'Forbidden: You are not the owner of this blog post' });
      }
  
      res.status(200).json({ message: 'Blog post deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  })

  function calculateAverageRating(ratings) {
    if (ratings.length === 0) {
      return 0; 
    }
  
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;

    return averageRating;
  
  }

  //rate a post
  router.post('/posts/:postId/rate', authentication, async (req, res) => {
    const { rating } = req.body;
    const postId = req.params.postId;
    const user_id = req.user._id.toString();
  
    try {

      const newRating = new Rating({
        user_id: user_id,
        post_id: postId,
        rating

      });

      await newRating.save();

      const blogPost = await Blog.findById(postId);
  
      if (!blogPost) {
        return res.status(404).json({ message: 'Blog post not found' });
      }


      blogPost.ratings.push(newRating);

      const getratings = await Rating.find({ _id: { $in: blogPost.ratings } });

      blogPost.avgRating = calculateAverageRating(getratings);
      
      await blogPost.save();
  
      res.status(200).json(blogPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


  //comment on a post
  router.post('/posts/:postId/comment', authentication, async (req, res) => {
    const { comment } = req.body;
    const postId = req.params.postId;
    const user_id = req.user._id.toString();

  
    try {

        const post = await Blog.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        
        const postWriter = await User.findById(post.user_id.toString());
        
        if (!postWriter) {
            return res.status(404).json({ message: 'Post writer not found' });
        }
        

      const newComment = new Comment({
        user_id: req.user._id,
        post_id: postId,
        comment

      });

      await newComment.save();

      const blogPost = await Blog.findById(postId);
  
      if (!blogPost) {
        return res.status(404).json({ message: 'Blog post not found' });
      }


      blogPost.comments.push(newComment);

      
      await blogPost.save();

      const commentNotification = new Notification({
        user_id: postWriter._id.toString(),
        type: 'comment',
        post_id: postId._id
    });

    await commentNotification.save();
  
      res.json(blogPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

  //follow user
  router.post('/posts/:userName/follow', authentication, async (req,res) =>{

    const userToFollow_uname = req.params.userName;
    const userFollower_ID = req.user._id.toString();

    try{
        const userToFollow = await User.findOne({username: userToFollow_uname});

    
        if(!userToFollow){
            return res.status(404).json({message: 'User not found!'});
        }

        if(userToFollow.followers.includes(userFollower_ID.toString())){
            return res.status(400).json({message: 'Already following this user'});
        }

        const personFollowing = await User.findById(userFollower_ID);
        personFollowing.following = personFollowing.following || [];

        
        if (personFollowing.following.includes(userToFollow._id.toString())) {
          return res.status(400).json({ message: 'Already following this user' });
        }

        userToFollow.followers.push(userFollower_ID);
        await userToFollow.save();

       
        personFollowing.following.push(userToFollow);
        await personFollowing.save();

        const followNotification = new Notification({
            user_id: userToFollow._id,
            type: 'follow',
        });
    
        await followNotification.save();
    

        res.json({ message: 'Successfully followed user' });

    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
  });


  router.post('/posts/:userName/unfollow', authentication, async (req,res) =>{

    const userToUnFollow_uname = req.params.userName;
    const userFollower_ID = req.user._id.toString();

    try{
        const userToUnfollow = await User.findOne({username: userToUnFollow_uname});

    
        if(!userToUnfollow){
            return res.status(404).json({message: 'User not found!'});
        }

       
        const personFollowing = await User.findById(userFollower_ID);
        personFollowing.following = personFollowing.following || [];

        userToUnfollow.followers.pull(userFollower_ID);
        await userToUnfollow.save();

       
        personFollowing.following.pull(userToUnfollow);
        await personFollowing.save();

        const unfollowNotification = new Notification({
            user_id: userToUnfollow._id.toString(),
            type: 'unfollow',
        });
    
        await unfollowNotification.save();
    

        res.json({ message: 'Successfully unfollowed user' });

    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
  });

  //display users feed with posts from followed bloggers

  router.get('/user/feed', authentication, async (req, res) =>{

    const user_id = req.user._id.toString();

    try{

        const userFeed = await User.findById(user_id);

        const followingUserIds = userFeed.following.map(userId => userId.toString());

        const feedPosts = await Blog.find({ user_id: { $in: followingUserIds }, isDisabled: false })
        .sort('-CreationDate')
        .populate('author', 'blogContent'); 

    res.json(feedPosts);

    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
  });


  //all unread notifications 
  router.get('/notifications', authentication, async (req, res) => {
    try {

        const notifications = await Notification.find({
            user_id: req.user._id,
            isRead: false,
        }).sort('-CreationDate');

        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


//mark all notifications as read
router.put('/notifications/mark-read', authentication, async (req, res) => {
    try {
        await Notification.updateMany(
            { user_id: req.user._id, 
                isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//view all users (admin)

router.get('/admin/users', authentication, async (req, res)=>{

    try{


        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You are not an admin' });
          }

        const users = await User.find();
        res.json(users);
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


//disable/block a user (admin)
router.put('/admin/:userName/disable', authentication, async (req,res)=>{

    const UserName = req.params.userName;
    
    try{

        
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You are not an admin' });
          }
        const userToDisable = await User.findOne({username: UserName});

        if(!userToDisable){
            return res.status(404).json({message: 'User not found!'});
        }

        const user = await User.findByIdAndUpdate(userToDisable._id, {isDisabled: true}, {new: true});

        res.json({ message: 'User disabled successfully' });
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});


//list all blog posts (admin)

router.get('/admin/blogPosts', authentication, async (req, res)=>{

    try{
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You are not an admin' });
          }

        
        const blogs = await Blog.find({isDisabled: false},'title author CreationDate avgRating');
        res.json(blogs);
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//get a particlular post (admin)
router.get('/admin/blogPosts/:blogTitle', authentication, async (req, res)=>{

    const blogtitle = req.params.blogTitle;

    try{


        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You are not an admin' });
          }

          const blog = await Blog.findOne({title: blogtitle});
        if(blog.isDisabled !== true){
            const blog = await Blog.findOne({title: blogtitle});

    
        if(!blog){
            return res.status(404).json({message: 'Blog not found!'});
        }
      
        res.json(blog);
        }
        else{
            res.json({message: 'Blog is disabled. Cannot Show'});
        }
        
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//disable a blog (Admin)
router.put('/admin/blogPosts/disable/:blogTitle', authentication, async (req,res)=>{

    const blogtitle = req.params.blogTitle;
    
    try{     
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You are not an admin' });
          }
        const BlogToDisable = await Blog.findOne({title: blogtitle});

        if(!BlogToDisable){
            return res.status(404).json({message: 'Blog not found!'});
        }

        const blog = await Blog.findByIdAndUpdate(BlogToDisable._id, {isDisabled: true}, {new: true});

        res.json({ message: 'Blog disabled successfully' });
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});


module.exports = router;
  