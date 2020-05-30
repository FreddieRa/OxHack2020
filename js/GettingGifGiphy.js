class GetGiph{
    constructor(APIkey = "ityag1M5myXGHtCjPeqtXtBYa38EUo46"){
        this.GphApiClient = require('giphy-js-sdk-core');
        this.client = GphApiClient(APIkey);

        this.client.search
    }

    getKey(){
        alert(this.client.APIkey);
    }

    SearchGiphs(SearchTerm){
        client.search('gifs', {"q": SearchTerm})
            .then((response) => {
                response.data.forEach((gifObject) => {
                console.log(gifObject)
                })
            })
        .catch((err) => {

        });
    }
}