const deleteCommentNotif = (btn) => {
    const commentId = btn.parentNode.querySelector('[name=commentId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    
    const notifElement = btn.closest('article');
    fetch('/delete-notif-comment/'+commentId,{
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