<?php get_header(); ?>
<main class="container content-area"><div class="page-title"><div class="eyebrow">Ikai.One catalogue</div><h1>Shop all products</h1><p class="muted">Browse our products and order directly through WhatsApp.</p></div>
<?php $cats=get_terms(array('taxonomy'=>'ikai_product_category','hide_empty'=>true)); if(!is_wp_error($cats)&&$cats): ?><div class="category-list" style="margin-bottom:28px"><?php foreach($cats as $cat): ?><a class="category-pill" href="<?php echo esc_url(get_term_link($cat)); ?>"><?php echo esc_html($cat->name); ?></a><?php endforeach; ?></div><?php endif; ?>
<?php if(have_posts()): ?><div class="product-grid"><?php while(have_posts()):the_post(); ikai_product_card(get_the_ID()); endwhile; ?></div><div style="margin-top:30px"><?php the_posts_pagination(); ?></div><?php else: ?><div class="empty-state">No products have been published yet. Please check back soon.</div><?php endif; ?></main>
<?php get_footer(); ?>
