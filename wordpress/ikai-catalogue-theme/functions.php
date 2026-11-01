<?php
if (!defined('ABSPATH')) exit;

function ikai_catalogue_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    add_theme_support('html5', array('search-form','gallery','caption','style','script'));
    register_nav_menus(array('primary' => __('Primary Menu','ikai-catalogue')));
}
add_action('after_setup_theme','ikai_catalogue_setup');

function ikai_catalogue_assets() {
    wp_enqueue_style('ikai-catalogue-style', get_stylesheet_uri(), array(), '1.0.0');
    wp_enqueue_script('ikai-catalogue-menu', get_template_directory_uri().'/assets/menu.js', array(), '1.0.0', true);
}
add_action('wp_enqueue_scripts','ikai_catalogue_assets');

function ikai_register_products() {
    register_post_type('ikai_product', array(
        'labels'=>array('name'=>'Products','singular_name'=>'Product','add_new_item'=>'Add New Product','edit_item'=>'Edit Product'),
        'public'=>true,'has_archive'=>true,'rewrite'=>array('slug'=>'shop'),
        'menu_icon'=>'dashicons-products','supports'=>array('title','editor','thumbnail','excerpt'),
        'show_in_rest'=>true
    ));
    register_taxonomy('ikai_product_category','ikai_product',array(
        'labels'=>array('name'=>'Product Categories','singular_name'=>'Product Category'),
        'hierarchical'=>true,'public'=>true,'rewrite'=>array('slug'=>'product-category'),'show_in_rest'=>true
    ));
}
add_action('init','ikai_register_products');

function ikai_product_meta_box() {
    add_meta_box('ikai_product_details','Product Details','ikai_product_meta_html','ikai_product','normal','high');
}
add_action('add_meta_boxes','ikai_product_meta_box');
function ikai_product_meta_html($post) {
    wp_nonce_field('ikai_save_product','ikai_product_nonce');
    $price=get_post_meta($post->ID,'_ikai_price',true);
    $sku=get_post_meta($post->ID,'_ikai_sku',true);
    $available=get_post_meta($post->ID,'_ikai_available',true);
    if ($available==='') $available='1';
    echo '<p><label for="ikai_price"><strong>Price (PKR)</strong></label><br><input id="ikai_price" name="ikai_price" type="number" min="0" step="1" value="'.esc_attr($price).'" style="width:100%;max-width:320px"></p>';
    echo '<p><label for="ikai_sku"><strong>SKU (optional)</strong></label><br><input id="ikai_sku" name="ikai_sku" type="text" value="'.esc_attr($sku).'" style="width:100%;max-width:320px"></p>';
    echo '<p><label><input type="checkbox" name="ikai_available" value="1" '.checked($available,'1',false).'> Available to order</label></p>';
    echo '<p class="description">Set a Featured Image in the right-hand panel. The product image and price appear in the catalogue.</p>';
}
function ikai_save_product_meta($post_id) {
    if (!isset($_POST['ikai_product_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['ikai_product_nonce'])),'ikai_save_product')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post',$post_id)) return;
    if (isset($_POST['ikai_price'])) update_post_meta($post_id,'_ikai_price',sanitize_text_field(wp_unslash($_POST['ikai_price'])));
    if (isset($_POST['ikai_sku'])) update_post_meta($post_id,'_ikai_sku',sanitize_text_field(wp_unslash($_POST['ikai_sku'])));
    update_post_meta($post_id,'_ikai_available',isset($_POST['ikai_available'])?'1':'0');
}
add_action('save_post_ikai_product','ikai_save_product_meta');

function ikai_whatsapp_number() { return '923094733789'; }
function ikai_whatsapp_url($product_id=0,$quantity=1) {
    $number=ikai_whatsapp_number();
    $message="Hello Ikai.One! I would like to order:\n";
    if ($product_id) {
        $title=get_the_title($product_id);
        $price=get_post_meta($product_id,'_ikai_price',true);
        $message.="Product: ".$title."\n";
        if ($price!=='') $message.="Listed price: PKR ".number_format((float)$price,0)."\n";
        $message.="Quantity: ".max(1,(int)$quantity)."\n";
        $message.="Product link: ".get_permalink($product_id)."\n";
    }
    $message.="Please confirm availability, final price and delivery details.";
    return 'https://wa.me/'.$number.'?text='.rawurlencode($message);
}
function ikai_product_price($product_id) {
    $price=get_post_meta($product_id,'_ikai_price',true);
    return $price!=='' ? 'PKR '.number_format((float)$price,0) : 'Contact for price';
}
function ikai_product_card($post_id) {
    $available=get_post_meta($post_id,'_ikai_available',true);
    if ($available==='') $available='1';
    ?>
    <article class="product-card">
      <a class="product-image" href="<?php echo esc_url(get_permalink($post_id)); ?>">
        <?php if (has_post_thumbnail($post_id)) echo get_the_post_thumbnail($post_id,'large'); else echo '<div class="image-placeholder">Product image</div>'; ?>
      </a>
      <div class="product-info">
        <h3><a href="<?php echo esc_url(get_permalink($post_id)); ?>"><?php echo esc_html(get_the_title($post_id)); ?></a></h3>
        <div class="price"><?php echo esc_html(ikai_product_price($post_id)); ?></div>
        <div class="product-meta"><?php echo $available==='1'?'Available to order':'Currently unavailable'; ?></div>
        <div class="product-actions">
          <a class="button" href="<?php echo esc_url(get_permalink($post_id)); ?>">View details</a>
          <?php if ($available==='1'): ?><a class="whatsapp-button" target="_blank" rel="noopener" href="<?php echo esc_url(ikai_whatsapp_url($post_id,1)); ?>">Order on WhatsApp</a><?php endif; ?>
        </div>
      </div>
    </article>
    <?php
}
