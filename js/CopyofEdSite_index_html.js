<html>
<head>
<title> Worxeter </title>
</head>
<body>
<script type="text/javascript" src="js/GettingGifGiphy.js"></script>
    <script>
        var GiphSearch

        function response(r) {
            var gif;
            var buttons = document.getElementById("buttons");
            var again = document.getElementById("tryAgain");
            if (r) {
                gif = "EdSite/resources/gifs/GeneralKenobi.gif"
            }
            else {
                gif = "EdSite/resources/gifs/Dissapointed.gif"
            }
            document.getElementById('myImage').src = gif;
            buttons.style.display = "none";
            again.style.display = "block";
        }

        function tryAgain(){
            var gif = "EdSite/resources/gifs/HelloThere.gif";
            var width = 480;
            var height = 240;
            var buttons = document.getElementById("buttons");
            var again = document.getElementById("tryAgain");
            document.getElementById('myImage').src = gif;
            document.getElementById('myImage').width = width;
            document.getElementById('myImage').height = height;
            buttons.style.display = "block";
            again.style.display = "none";
}

    </script>
<center>
    <h1>HELLO THERE</h1>
    <img id="myImage" src="EdSite/resources/gifs/HelloThere.gif" width="480" height="240">
    <p id="buttons">
        <button type="button" onclick="response(1)">General Kenobi!</button>
        <button type="button" onclick="response(0)">Hi</button>
    </p>
    <p id="tryAgain" style="display:none;">
        <button type="button" onclick="tryAgain()">Try Again</button>
    </p>
</center>

</body>


</html>