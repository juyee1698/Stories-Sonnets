const deleteBlogNotif = (btn) => {
    const blogId = btn.parentNode.querySelector('[name=blogId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    console.log("I am here");
    const notifElement = btn.closest('article');
    fetch('/delete-notif-blog/'+blogId,{
        method:'POST',
        headers:{
            'csrf-token':csrf
        }
        
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        notifElement.parentNode.removeChild(notifElement);
    })
    .catch(err => {

    });
};