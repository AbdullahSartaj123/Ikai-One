<!doctype html>
<html <?php language_attributes(); ?>>
<head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width, initial-scale=1"><?php wp_head(); ?></head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<header class="site-header"><div class="container header-inner">
<a class="brand" href="<?php echo esc_url(home_url('/')); ?>" aria-label="Ikai.One home">Ikai<span>.</span>One</a>
<button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false" onclick="document.querySelector('.main-nav').classList.toggle('is-open');this.setAttribute('aria-expanded',this.getAttribute('aria-expanded')==='true'?'false':'true')">☰</button>
<nav class="main-nav" aria-label="Main navigation">
<a href="<?php echo esc_url(home_url('/')); ?>">Home</a><a href="<?php echo esc_url(get_post_type_archive_link('ikai_product')); ?>">Shop</a>
<?php if (has_nav_menu('primary')) wp_nav_menu(array('theme_location'=>'primary','container'=>false,'items_wrap'=>'%3$s')); ?>
<a class="whatsapp-button" target="_blank" rel="noopener" href="<?php echo esc_url(ikai_whatsapp_url()); ?>">WhatsApp us</a>
</nav></div></header>
