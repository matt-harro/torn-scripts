function hookXMLHttpRequest({ window }) {
  const OriginalXMLHttpRequest = window.XMLHttpRequest;

  // note: normally takes no params, except for a Mozilla non-standard extension
  // http://devdocs.io/dom/xmlhttprequest/xmlhttprequest
  window.XMLHttpRequest = function XMLHttpRequest(mozParam) {
    const request = new OriginalXMLHttpRequest(mozParam);

    try {
      let method = null;
      let url = null;
      let body = null;

      // intercept open() to grab method + url
      const originalOpen = request.open;
      request.open = function open() {
        try {
          method = (arguments[0] || 'GET').toUpperCase();
          url = (arguments[1] || '').toLowerCase();
        } catch (e) {
          console.error('intercepting XMLHttpRequest open()', e);
        }

        return originalOpen.apply(request, arguments);
      };

      // intercept send() to grab the optional body
      const originalSend = request.send;
      request.send = function send() {
        try {
          body = arguments[0];
          if (typeof body === 'string' && body[0] === '{') {
            try {
              body = JSON.parse(body);
            } catch (error) {
              console.warn(
                `${CONSOLE_MARKER} error parsing XHR request body`,
                error,
                {
                  method,
                  url,
                  body,
                }
              );
            }
          }

          console.log({
            api: 'XMLHttpRequest',
            method,
            url,
            body,
          });
        } catch (error) {
          console.error('intercepting XMLHttpRequest send()', error); // TEST
        }

        return originalSend.apply(request, arguments);
      };

      // listen to request end
      request.addEventListener('load', () => {
        try {
          let { response } = request;
          if (typeof response === 'string' && response[0] === '{') {
            try {
              response = JSON.parse(response);
            } catch (error) {
              console.warn(
                `${CONSOLE_MARKER} error parsing XHR response`,
                error,
                {
                  method,
                  url,
                  response,
                }
              );
            }

            console.log({
              api: 'XMLHttpRequest',
              method,
              url,
              body,
              status: request.status,
              response,
            });
          }
        } catch (error) {
          console.error('processing XMLHttpRequest load evt', error); // TEST
        }
      });
    } catch (error) {
      console.error('intercepting XMLHttpRequest', error); // TEST
    }

    return request;
  };
}

// function getItemData(params) {
//   let data = {};

//   let searchParams = new URLSearchParams(params);

//   for (const [key, value] of searchParams.entries()) {
//     data[key] = value; // adds itemID and ID to data object
//   }

//   const listItemsArray = [...document.querySelectorAll('ul.items > li')];
//   const itemEl = listItemsArray.find((el) => {
//     if (document.location.hash.match(/p=market/)) {
//       return el.querySelector(`a.buy-link[data-id="${data.ID}"]`);
//     }
//     return el.querySelector(`span[data-id="${data.ID}"]`);
//   });

//   data.price = getPrice(itemEl);

//   return data;
// }

// function hookXMLHttpRequest({ window }) {
//   const OriginalXMLHttpRequest = window.XMLHttpRequest;

//   // note: normally takes no params, except for a Mozilla non-standard extension
//   // http://devdocs.io/dom/xmlhttprequest/xmlhttprequest
//   window.XMLHttpRequest = function XMLHttpRequest(mozParam) {
//     const request = new OriginalXMLHttpRequest(mozParam);

//     try {
//       let method = null;
//       let url = null;
//       let body = null;

//       // intercept open() to grab method + url
//       const originalOpen = request.open;
//       request.open = function open(...args) {
//         try {
//           method = (args[0] || 'GET').toUpperCase();
//           url = (args[1] || '').toLowerCase();
//         } catch (e) {
//           console.error('intercepting XMLHttpRequest open()', e);
//         }

//         return originalOpen.apply(request, args);
//       };

//       // intercept send() to grab the optional body
//       const originalSend = request.send;
//       request.send = function send() {
//         try {
//           body = arguments[0];
//           if (typeof body === 'string' && body[0] === '{') {
//             try {
//               body = JSON.parse(body);
//             } catch (error) {
//               console.warn(
//                 `${CONSOLE_MARKER} error parsing XHR request body`,
//                 error,
//                 {
//                   method,
//                   url,
//                   body,
//                 }
//               );
//             }
//           }

//           // console.log({
//           //   api: 'XMLHttpRequest',
//           //   method,
//           //   url,
//           //   body,
//           // });

//           // inject our quick buy request
//         } catch (error) {
//           console.error('intercepting XMLHttpRequest send()', error);
//         }

//         if (url.match(/imarket\.php\?rfcv=/) && body.match(/step=buyItem&/)) {
//           const data = getItemData(body);

//           const formData = new URLSearchParams();
//           formData.append('step', 'buyItemConfirm');
//           formData.append('ID', data.ID);
//           formData.append('item', '0');
//           formData.append('price', data.price);
//           const params = formData.toString();

//           return originalSend.apply(request, [params]);
//         }

//         return originalSend.apply(request, [...arguments]);
//       };

//       // listen to request end
//       request.addEventListener('load', () => {
//         try {
//           let { response } = request;
//           if (typeof response === 'string' && response[0] === '{') {
//             try {
//               response = JSON.parse(response);
//             } catch (error) {
//               console.warn(
//                 `${CONSOLE_MARKER} error parsing XHR response`,
//                 error,
//                 {
//                   method,
//                   url,
//                   response,
//                 }
//               );
//             }

//             // console.log({
//             //   api: 'XMLHttpRequest',
//             //   method,
//             //   url,
//             //   body,
//             //   status: request.status,
//             //   response,
//             // });
//           }
//         } catch (error) {
//           console.error('processing XMLHttpRequest load evt', error);
//         }
//       });
//     } catch (error) {
//       console.error('intercepting XMLHttpRequest', error);
//     }

//     return request;
//   };
// }
