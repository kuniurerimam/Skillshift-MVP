import { response } from "express";

// ******************************The javascript for the navBar***************************************
$(".burger").on("click", function () {
    $(".burger").css("display", "none");
    $(".burger_list").addClass("burger_list_active");
    $(".burger_list").css("display", "block");
    $(".nav-links").addClass("nav-links_active");
    $(".nav-links li").addClass("nav-links_li_active");
    $(".close_burger_list").addClass("close_burger_list_active");

});

$(".close_burger_list").on("click", function () {
    $(".burger").css("display", "block");
    $(".burger_list").removeClass("burger_list_active");
    $(".burger_list").css("display", "none");
});


// ********************************The javascript for the login page**********************************


