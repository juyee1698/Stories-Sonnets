// const addReview = () => {
// fetch("/add-review").then(response => response.text()).then(data => {
//     console.log(data);
//     document.querySelector(".review_box form").onsubmit = event => {
// 		event.preventDefault();
// 		fetch('/add-review', {
//             method: 'POST',
//             headers:{
//                 'csrf-token':csrf
//             },
// 			body: new FormData(document.querySelector(".review_box form"))
// 		}).then(response => response.text()).then(data => {
//             console.log(data);
// 			document.querySelector(".review_list .review_item").innerHTML = data;
// 		});
// 	};
// });

// const addReview = (btn) => {
//     const product = btn.parentNode.querySelector('[name=product]').value;
//     const author = btn.parentNode.querySelector('[name=author]').value;
//     const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
//     console.log(product);

//     fetch('/add-review',{
//         method:'POST',
//         headers:{
//             'csrf-token':csrf
//         },
//         body:{
//             'product':product,
//             'author':author
//         }
//     })
//     .then(result => {
//         return result.json();
//     })
//     .then(data => {
//         console.log(data);
//     })
//     .catch(err => {
//         console.log(err);
//     });
// };

const addReview = (e) => {
    e.preventDefault();
    console.log("hello");
}