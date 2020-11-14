const deleteBlog = (btn) => {
    const blogId = btn.parentNode.querySelector('[name=blogId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    const blogElement = btn.closest('article');
    fetch('/blog-delete/'+blogId,{
        method:'DELETE',
        headers:{
            'csrf-token':csrf
        }
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        blogElement.parentNode.removeChild(blogElement);
    })
    .catch(err => {

    });
};