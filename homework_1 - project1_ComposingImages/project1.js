// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// -> The alpha values of the foreground image should be scaled using this argument. 
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means 
// the top-left pixels of the foreground and background are aligned.
//  The foreground image may have a different size and its position can be negative. The parts of 
// the foreground image that fall outside of the background image should be ignored.

function composite( bgImg, fgImg, fgOpac, fgPos )
{       //image.data -> rgba (monodimensional array -> [R, G, B, A,  R, G, B, A....] ), 
        //image.width, image.height                    [ (1° pixel)   (2° pixel)...]
        //we need to multiply the extra channel "a" for the alpha value fgopac
        //the formule to fuse the pixels of the foregraound and background image is:
        //fgopac*fgImg[i]+(1-fgopac)*bgImg[i] where i=r,g,b = 0,1,2

    for (let i=0; i< fgImg.height; i++) { // iterate over the rows of the foreground image
        for(let j=0; j<fgImg.width; j++) {
            //find the corresponding position in the background image of the foreground image
            //fgPos contains the x and y coordinates of the top-left corner of the foreground image
            //(fgPos.x, fgPos.y)
            fg_X=fgPos.x+j;
            fg_Y=fgPos.y+i;
            if(fg_X<0 || fg_Y<0 || fg_X>=bgImg.width || fg_Y>=bgImg.height) {
                continue; // ignore the pixels outside the background image
            }

            //get the pixel rgba indeces of the foreground image in image.data
            R_fg=fgImg.data[4*(i*fgImg.width+j)];
            G_fg=fgImg.data[4*(i*fgImg.width+j)+1];
            B_fg=fgImg.data[4*(i*fgImg.width+j)+2];
            A_fg=fgImg.data[4*(i*fgImg.width+j)+3];
            
            //get the pixel rgba indeces of the background image in image.data
            R_bg=bgImg.data[4*(fg_Y*bgImg.width+fg_X)];
            G_bg=bgImg.data[4*(fg_Y*bgImg.width+fg_X)+1];
            B_bg=bgImg.data[4*(fg_Y*bgImg.width+fg_X)+2];
            A_bg=bgImg.data[4*(fg_Y*bgImg.width+fg_X)+3];

            //fuse the pixels of the foreground and background image
            alfa_f=fgOpac*(A_fg/255); //alpha is [0,255] -> need to convert to [0, 1]
            alfa_b=A_bg/255;
            R_fused=alfa_f*R_fg+(1-alfa_f)*R_bg;
            G_fused=alfa_f*G_fg+(1-alfa_f)*G_bg;
            B_fused=alfa_f*B_fg+(1-alfa_f)*B_bg;
            A_fused=(alfa_f+(1-alfa_f)*alfa_b)*255; //convert back to [0,255]

            //update the bgImg with the fused pixel
            bgImg.data[4*(fg_Y*bgImg.width+fg_X)]=R_fused;
            bgImg.data[4*(fg_Y*bgImg.width+fg_X)+1]=G_fused;
            bgImg.data[4*(fg_Y*bgImg.width+fg_X)+2]=B_fused;
            bgImg.data[4*(fg_Y*bgImg.width+fg_X)+3]=A_fused;
        }
    }
}
