import Post from "@partials/Post";

const PostGrid = ({ posts, highlight }) => {
  return (
    <div className="row">
      {posts.map((post, i) => (
        <div className="mb-8 md:col-6 lg:col-4" key={post.slug || i}>
          <Post post={post} highlight={highlight} />
        </div>
      ))}
    </div>
  );
};

export default PostGrid;
